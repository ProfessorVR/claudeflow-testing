# bex — Boredom Experiment (VR Attention Study) — Raw-Dataset Channel Ontology

The citable home for Part III's **lab/VR pole as a raw dataset**: the Boredom Experiment (VR Attention Study), an
8-subject study collecting EEG, HMD telemetry, session video (OBS), eye-tracking, and per-video self-reports across
three 17-min stimuli (Boring / Interesting / Clinical). This entry is the **raw-dataset / channel-structure anchor**;
its anonymized *derivative* view — aggregates, the four load-bearing cases, and the felt-duration findings — already
lives as **`vle-02-boredom-raw-dataset`** under the King–Salvo VLE anchor, and the study's *findings* are registered as
vle nodes 10–14 there. **This entry does not duplicate those findings** — its nodes are the dataset's **channels** (its
measurement structure), the layer the derivative and the FCM keystone draw from.

Provenance registers: **FE** = faithful-empirical published (P1 physiological / P2 eye-tracking) · **FE-U** =
faithful-empirical unpublished raw record (per-video self-reports; dissertation use pending **O-10** consent-scope
confirmation) · **FH** = faithful-Heidegger · **P** = projected reading (`anticipatory-application`).

**Three hard gates hold over this entry (see `units/bex-00-corpus-overview.md` §Gates):** PII (subjects are `S01–S08`
only; no real name in any file); O-10 (FE-U kept at the `vle-02` derivative level — aggregates + four cases, **no
per-subject matrix** committed); O-9 (`.mat` EEG / HMD telemetry / OBS video are **declared-but-unprocessed** metadata).

**Future work (deferred processing).** Four channels are catalogued but **not yet processed** — `ch-eeg` (raw
`.mat`), `ch-hmd` (telemetry), `ch-obs` (session video), `ch-fig` (`.fig` outputs). They are recorded here so the
index knows what the lab pole *contains*; their processing (per-subject EEG reprocessing, telemetry decoding, GPU
comportment scoring of the OBS surface) is deferred under O-9 and should be taken up in a later pass. Only
`ch-selfreport` (aggregates) and `ch-gaze`/`ch-eeg` at the published-derivation level are currently usable.

## Map of the entry
- **units/** `bex-00-corpus-overview` · `bex-01-selfreport-record` · `bex-02-eeg-workload` · `bex-03-gaze-arousal` · `bex-04-stimulus-corpus`.
- **_synthesis/** this file · `manifest.json` (entry meta + `channels[]` spec + outbound bridges) · `graph-channel-map.mmd`.
- **bridge-sources/** `paper-digest-pointers.md` (P1/P2/P3 digests live at the FCM entry — not duplicated).
- **Outbound relationships (this anchor points OUT):** → FCM `_synthesis/fcm-king-salvo-bridge.md` (the second-form
  two-channel **keystone**: EEG reads clinical boring-like while gaze reads it engaging-like, p=0.0004, self-report
  engaged, felt-time dilated) · → Part III M2/M3 (the felt-duration / *Hingehaltenheit* record + the two-channel
  divergence datum) · → the King–Salvo `vle-02` derivative (this raw dataset is what `vle-02` anonymizes).
- **Cohort-N heterogeneity (kept distinct):** P1 EEG N=3 (one clean) · P2 gaze N=12 · raw self-report N=8 (S01–S08).
  A published-channel derivation (P1/P2) is **not** the same cohort as the raw N=8 per-subject record.

## 3A. Canonical Node List

#### 1. ch-selfreport — per-video self-report channel
- **definition**: The 7-item per-video questionnaire (fatigue-prior 1–9 · boredom 1–9 · engagement 1–9 · minutes-until-bored · sleep-fight 1–9 · **felt-duration** · fatigue-after), administered to 8 subjects across 3 stimuli = 24 episodes; viewing order recorded where noted [FE-U, use pending O-10]. The channel `vle-02`'s aggregates and four load-bearing cases derive from; the raw per-subject matrix stays in the untracked reanalysis brief and is **not** committed here.
- **type**: DATASET-CHANNEL
- **units**: bex-01
- **centrality**: core
- **aliases**: 7-item instrument, felt-duration channel, boredom/engagement self-report

#### 2. ch-eeg — 4-channel EEG workload channel
- **definition**: F3, F4, P3, P4 DMN alpha/theta; `.mat` ×3 per subject; published as P1 (ASEE 2023 #37129, N=3, one clean subject — clinical ≈ boring control). A B-Alert workload-band crosswalk (boredom<.40 / ideal .40–.70 / overload>.70) runs **parallel, not commensurable**, with self-report boredom. **Raw `.mat` streams are UNPROCESSED (O-9 deferred) — a priority for future processing.**
- **type**: DATASET-CHANNEL
- **units**: bex-02
- **centrality**: core
- **aliases**: EEG channel, DMN workload, physiological channel (P1)

#### 3. ch-gaze — eye-tracking gaze/arousal channel
- **definition**: Gaze-deviation variance @120 Hz + pupil dilation; published as P2 (ASEE 2024 #44685, N=12): clinical-vs-boring **p=0.0004**, clinical resembling engaging; high-arousal searching gaze vs low-arousal "zombie stare." Published derivation only — its N=12 cohort is **not** the raw N=8 self-report cohort.
- **type**: DATASET-CHANNEL
- **units**: bex-03
- **centrality**: core
- **aliases**: eye-tracking channel, searching-gaze vs zombie-stare, arousal channel (P2)

#### 4. ch-stimulus — video-stimulus corpus
- **definition**: Ten state-contrast 4K60 compilations plus per-subject labeled clips; naming key CLC/INT/Boring × LA/HA/IE/E/ME/AS (EC = eyes-closed); 17-min actual length. Three canonical stimuli: Boring = 1989 Word tutorial · Interesting = alien-reproduction-vehicles · Clinical = 360° spinal surgery. Aliases: BOR≡Boring, CLC≡Clinical, INT≡Interesting.
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: core
- **aliases**: stimulus corpus, 4K60 compilations, media-condition channel

#### 5. ch-hmd — HMD telemetry / exposure channel
- **definition**: HP Reverb G2 Omnicept telemetry; exposure-duration / session-time protocol — the reference for exposure-time and cybersickness questions. **Telemetry is UNPROCESSED (O-9 deferred); decoding is future work.**
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: supporting
- **aliases**: HMD channel, exposure protocol, Omnicept telemetry

#### 6. ch-obs — session-video comportment channel
- **definition**: OBS session recordings (posture / fidget / watch-glance comportment) — the visible-*Zeitvertreib* surface channel that would supply a third behavioral surface against the self-report and gaze channels. **Session video is UNPROCESSED (O-9 deferred); GPU comportment reads are future work — the visible-*Zeitvertreib* surface is not yet scored.**
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: supporting
- **aliases**: OBS channel, comportment video, behavioral-surface channel

#### 7. ch-fig — analysis-figure channel
- **definition**: Per-subject MATLAB `.fig` analysis outputs derived from the EEG/gaze channels. **UNPROCESSED here — metadata only; regenerating/extracting from the `.fig` outputs is future work (O-9).**
- **type**: DATASET-CHANNEL
- **units**: bex-04
- **centrality**: peripheral
- **aliases**: figure channel, MATLAB .fig outputs
