# PLAN — S01 vs S04 gaze-location comparison from the eye-tracking overlay videos

**Status: awaiting author review. Nothing executed.** 2026-08-07.

**Question this answers.** Were S01 and S04 looking at the same places on the tutorial while
watching it? The per-sample CSV data cannot answer this: it records gaze as an *eye-in-head*
angle, and head pose was never instrumented, so two people with differently-tilted heads can
produce very different angles while looking at identical content. The overlay videos solve it,
because they render the gaze marker onto the stimulus as the participant saw it.

---

## 1. What the material actually is (verified 2026-08-07)

| | S01 boring | S04 boring |
|---|---|---|
| resolution | 3840 x 2160 | 3840 x 2160 |
| frame rate | 60 fps | 60 fps |
| duration | 733.8 s | 826.5 s |
| frames | 44,028 | 49,590 |

**The video durations match the analyzed crop windows** (S01 crop 732.9 s, S04 crop 826.8 s), so
these recordings correspond to the same windows every other number in this section comes from.
No re-cropping is needed.

**The overlay renders a saturated green disc as the gaze marker**, roughly 12 px across at 4K,
against a scene that is otherwise near-grayscale with a blue border. Detection is a colour
threshold, not a tracking problem.

**The two participants' framings differ.** In matched sample frames the tutorial display
occupies a noticeably larger share of S04's view than S01's, so the participants sat or held
their heads differently. This is exactly why raw frame coordinates cannot be compared and why
step 3 below exists.

**The recordings are offset in content time.** At 300 s into each file the tutorial's own
on-screen clock reads 6:49 PM for S01 and 6:48 PM for S04, so the two crops begin at different
points in the film. Step 2 handles this.

---

## 2. Temporal alignment — putting both on the film's own clock

The stimulus is identical for both participants, so alignment is a content-matching problem.

**Method.** Compute a one-dimensional content signature per frame — the mean luminance of the
detected display region, which varies as the tutorial's slides and camera cuts change — for both
videos. Cross-correlate the two signatures to find the offset in frames that maximizes
agreement. Verify the result independently against the tutorial's visible on-screen clock, which
gives a coarse but fully independent check.

**Output.** A single integer frame offset, plus the overlapping span in which both recordings
show the same film content. Only that overlap is compared. Given the durations, expect roughly
twelve minutes of common content.

**Failure mode to watch.** If the cross-correlation peak is not sharp and unambiguous, alignment
is unreliable and the whole comparison must be abandoned rather than reported with a caveat.
This is a hard gate, and I will report the peak's sharpness rather than just its location.

---

## 3. Per-frame extraction, at the full 60 fps

For every frame in the overlapping span, in both videos:

1. **Locate the gaze marker.** Threshold in HSV for the marker's green, take the largest
   connected component, and record its centroid. Frames with no marker are recorded as
   `marker absent` rather than interpolated.
2. **Locate the display.** Segment the bright tutorial region against the dark surround and fit
   its quadrilateral. The display is a curved virtual screen, so the fit is a four-corner
   homography rather than a rectangle.
3. **Normalize.** Map the marker centroid through that homography into display coordinates
   running 0 to 1 horizontally and vertically. **This is the step that makes the two
   participants comparable**, because it removes the difference in how each one's head framed
   the screen.
4. **Record** frame index, film time, marker position in display coordinates, and a validity
   flag.

Decoding is done at reduced resolution (960 px wide) since the marker remains several pixels
across; this is a speed measure only and does not affect normalized coordinates.

---

## 4. The comparison

With both participants expressed in display coordinates on a common film clock:

- **Distance per frame** between the two gaze points, in units of display width. Reported as a
  distribution, not a mean.
- **Agreement rate** — the share of common frames where the two are within 5%, 10% and 20% of
  display width of each other.
- **Spatial overlap** of their gaze distributions across the whole episode, as a 2-D histogram
  intersection, which answers the question independently of moment-to-moment synchrony. Two
  people can attend the same regions without doing so simultaneously, and that distinction
  matters for the claim.
- **Time on the display at all** — the share of frames where each participant's gaze was on the
  tutorial rather than elsewhere in the virtual room. This is a focus measure that the CSV data
  cannot produce, and it bears directly on the attention-span reading.

---

## 5. Validation before any result is believed

- **Against the CSV.** The Round 1 logs give gaze at about 3 Hz. Downsample the extracted
  60 Hz signal to those timestamps and confirm the two agree in direction and shape. If the
  video-derived signal contradicts the logged data, the extraction is wrong.
- **Against the eye-closure record.** S01 has both eyes shut for 9% of his episode and S04 for
  8%. Marker-absent frames should correspond, and their proportion should be in that
  neighbourhood.
- **By hand.** Sample twenty frames spread across the episode, render the detected marker and
  display quad onto them, and check by eye. Included in the deliverable so it can be reviewed.

---

## 6. Cost, risk, and what could make this not worth doing

**Compute.** About 94,000 frames of 4K video across the two files. Decoding dominates; expect
roughly fifteen to twenty-five minutes per video, run in the background.

**Risks, in order of seriousness.**

1. **Alignment fails.** If the content signatures do not cross-correlate sharply, there is no
   defensible comparison. Hard stop, reported as such.
2. **Display detection fails on a curved screen.** The virtual display is bowed, so a
   four-corner fit is an approximation. If residuals are large the normalization is unreliable.
   Mitigation: report the fit residual distribution, and fall back to comparing only the
   central region of the display where curvature is least.
3. **The result is uninteresting either way.** If the two participants overlap heavily, that
   supports the author's visual impression. If they do not, it contradicts it. Both are
   publishable, but neither changes the section's principal finding, which rests on gaze
   *dispersion* rather than gaze *location*.

**What this does NOT do.** It compares two participants on one film. It is a case study and
cannot carry a statistical claim about the cohort; with n = 2 there is no test worth running.
It should be written as description supporting the S01 paragraph, not as a result in its own
right.

---

## 7. Deliverables

1. `s01-s04-gaze-video/` containing the per-frame extraction for both participants as CSV.
2. The alignment report — offset, correlation peak, clock cross-check.
3. The comparison figures and the four numbers in section 4.
4. The twenty validation frames with detections drawn on.
5. A short findings note stating what the comparison shows and what it cannot support.

**PII.** The source folders and filenames carry participant names. Outputs are keyed S01 and
S04 only, and no rendered frame showing a face is included — the validation frames are of the
stimulus display, which contains the tutorial's own presenter but no participant.
