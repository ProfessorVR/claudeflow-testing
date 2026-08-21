> # ⛔ SUPERSEDED — DO NOT USE
>
> **This document is archived history. It is NOT the current state and must not be
> read as instructions, quoted for numbers, or used to boot a session.**
>
> **Superseded by:** `DECISIONS-REGISTER-v3-2026-08-04.md`
> **Archived:** 2026-08-04 · **Reason:** first register; 11 open items, now 15
>
> Retained only for rollback and audit. If you are an agent selecting a document to
> work from, STOP and use the superseded-by file above.

---

# DECISIONS REGISTER — Laboratory Boredom section (v1, 2026-07-31)

Standing record of what has been ruled, what is deferred, and what is still open.
Versioned: supersede with `-v2-` rather than editing in place.

---

## 1. RULED — analysis scope and channel status

| # | Ruling | Date |
|---|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed by the headset; inputs and derivation unknown. Report in an appendix for interest; no dissertation claim may rest on it. | 2026-07-31 |
| R-02 | **Heart rate and HRV removed entirely from the analysis.** The measurement failed for some participants owing to facial and head structure. Appendix only, alongside cognitive load. | 2026-07-31 |
| R-03 | **IMU head motion — DEFERRED.** Not analysed in this pass. Revisit after the section is drafted if time permits. | 2026-07-31 |
| R-04 | **Video-derived head pose — DEFERRED**, alongside the IMU. Same revisit condition. | 2026-07-31 |
| R-05 | **Load-bearing channel set:** pupil dilation, eye openness/closure, gaze (eye-in-head), and the seven-item self-report instrument. EEG separately reported as a full negative. | 2026-07-31 |
| R-06 | **Equal focus on all three films.** The clinical-centred framing was an IRB and publication necessity; the dissertation is not bound by it. | 2026-07-31 |
| R-07 | **Survey administration:** completed in the break immediately after each film, per episode. | 2026-07-31 |
| R-08 | **Boring stimulus** = a 17-minute section of a 1989 Microsoft Word tutorial. | 2026-07-31 |
| R-09 | **S04's `minutes until bored` on the boring film is void** — she did not know she could answer 0 or not-applicable. Reclassified as *never became bored*. | 2026-07-31 |
| R-10 | **R2-03's split session dates** (Interesting three days before the other two): ignore, do not report. | 2026-07-31 |
| R-11 | **Overlay videos** are in scope as corroborating material for later analysis, not as the foundation of any claim. | 2026-07-31 |

## 2. RULED — data and method

| # | Ruling | Date |
|---|---|---|
| D-01 | **Round 2 read from `_Crop` files exclusively**, mirroring Round 1. Fail loudly if an original exists without a crop; log genuine stream absences. | 2026-07-31 |
| D-02 | **`t_rel_s` is the session clock** — common zero across all streams. Retires the D4 timestamp-repair wrapper. | 2026-07-31 |
| D-03 | **Streams identified by filename**, not column count. Every file names its own measurement. Removes the cognitive-load/HRV ambiguity permanently. | 2026-07-31 |
| D-04 | **Gate re-baselined.** The two Round-1-only checks must return bit-identical; the two pooled checks are re-derived from the first v2 run. v1 values frozen as the record. | 2026-07-31 |
| D-05 | **Both Round 2 windows analysed and labelled**: full crop, and a Round-1-matched window dropping 120 s from each end. | 2026-07-31 |
| D-06 | **Two composites, both labelled**: A = pupil + eye openness; B = A + gaze. B is not poolable across rounds. | 2026-07-31 |
| D-07 | **Version discipline.** Documents chain `-v1-`, `-v2-`, `-v3-`; prior versions never edited. `boredom-analysis-2026-07-30/` frozen as v1; work proceeds in a v2 tree. `.backups/` retained in addition. | 2026-07-31 |
| D-08 | **CropEvents.json is metadata, not a data source.** Not read by any feature. | 2026-07-31 |

## 3. ESTABLISHED — findings about the instrument itself

| # | Finding |
|---|---|
| F-01 | **Round 1 was recorded in Unreal; Round 2 in Unity.** Axis conventions differ. Round 1: **X = forward, Y = horizontal, Z = vertical** (up positive). Round 2: **X = horizontal, Y = vertical, Z = forward**. Confirmed by the original MATLAB (`eyetrackdatamapping_V3.m`, Das 2023), which plots Y as horizontal and Z as vertical and scatters (Y,Z) on a 16:9 screen. |
| F-02 | **The published gaze feature is deviation from a FIXED FORWARD reference** — `1 − X`, then a 5-point median filter. Our reimplementation substituted each file's own median gaze direction, which removes sustained posture by construction. Restoring fixed-forward is a restoration, not an invention. |
| F-03 | **Both rounds' gaze vectors are eye-in-head, not head pose.** Round 2 `cgaze` never exceeds 38.8° in any of 12 cells and has zero samples beyond 50°; Round 1 sits in the same envelope. The overlay confirms it: the head swings through ~90° of roll and a deep downward pitch while the gaze dot stays near frame centre. |
| F-04 | **Head movement is where the disengagement is visible, and it is unmeasured in this pass.** Round 1 has no head channel; Round 2's IMU is deferred. The section must not claim the boring film produced stillness. |
| F-05 | **Round 1's window is the middle ~13.6 min** of the 17-minute film (~2 min cut inside each 30 s instructed closure, as a sync guard). Round 2's crop is essentially the whole film. Round 1 therefore cuts the tail, where withdrawal would be greatest, and understates the effect. |
| F-06 | **Round 2 openness is binary at source** — {0,1} only across 3.4 M per-eye samples. The blink/closure split rests entirely on the 500 ms duration ceiling. |
| F-07 | **Round 1 blink sentinel is the vector (−1, +1, −1)** — note Y's sentinel is positive. Verify masking covers it. |

## 4. DEFERRED

| # | Item | Condition |
|---|---|---|
| X-01 | IMU head motion analysis | after drafting, if time permits |
| X-02 | Video-derived head pose (panel tracking, panel-visibility fraction) | as above |
| X-03 | Gaze baseline sensitivity beyond the two computed | v3 |

## 5. OPEN — awaiting the author

| # | Question |
|---|---|
| O-01 | **The EEG framing.** Your account — cross-validation completed against self-report, then dropped for scaling — against the current "dropped because too noisy" ruling. Does the N=8 non-replication get told alongside it? |
| O-02 | **Naming the openness surface.** One term, one definition. Round 1's is a validity proxy, Round 2's a vendor channel. |
| O-03 | **The two ASEE works-cited entries** and the co-author/participant surname overlap. |
| O-04 | **Within-episode time course** and **viewing order** — computed but never reported. Run them? |
| O-05 | **Per-participant matrix as an appendix**, now covering all three films. |
| O-06 | **How much of P1/P2 to re-present** versus cite. |
| O-07 | **Prior exposure** as an analytic variable or a footnote. |
| O-08 | **How much statistical apparatus** the rendered prose carries. |
| O-09 | **Section length and module weighting.** |
| O-10 | **The boring film's exact title and source** for the works cited. |
| O-11 | Accept as a stated limit that Round 1 measures the eye only, with no head channel. |

## 6. STANDING — unchanged

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted; no name in any output, log, figure, caption or filename.
Verification-gated: quotes char-exact before entering prose; index entries first, then PDFs; backups before touching approved files; nothing committed without explicit sign-off.
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never "prove".
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for channels that do not; anything n<6 labelled descriptive.
Category caution: episodic structural grammar only, never a *Grundstimmung* claim. No learning-outcome claims.
