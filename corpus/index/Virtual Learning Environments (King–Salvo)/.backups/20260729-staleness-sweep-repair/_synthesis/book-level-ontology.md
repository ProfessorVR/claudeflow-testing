# vle — Empirical-Corpus Ontology (King–Salvo Virtual Learning Environments)

The citable home for Part III's **empirical corpus**: three King–Salvo publications (P1 ASEE 2023 #37129 physiological · P2 ASEE 2024 #44685 eye-tracking · P3 *Biomed Eng Educ* 4 (2024): 381–397 phenomenological), the **three-term deployment survey corpus** (W25/S25/W26, N=241, 873 open responses, 2D-PC-primary era), and the **boredom raw dataset** (8 subjects: EEG/HMD/OBS + per-video self-reports; anonymized S01–S08). Unlike the book entries, the nodes below are **empirical-analytical**: each names a finding-structure of this corpus, with its provenance register (FE = faithful-empirical published · FE-U = faithful-empirical unpublished raw record, use pending O-10 · P = projected reading, `anticipatory-application`). Paper digests are NOT duplicated here — see `bridge-sources/paper-digest-pointers.md` (FCM entry holds the canonical digests + the King–Salvo bridge).

## Map of the entry
- **units/** `vle-00-corpus-overview` · `vle-01-deployment-survey` · `vle-02-boredom-raw-dataset` · `vle-03-exemplar-bank` · `vle-04-mark-attention-span`.
- **_synthesis/** this file · `manifest.json`.
- **bridge-sources/** `paper-digest-pointers.md`.
- **Analysis provenance:** built from `tmp/Dissertation/Part_III/` (methodology-application layer G1 package; survey-analysis 00–05; boredom-dataset audit; reanalysis briefs). Coding reliability: batch-6 double-blind subsample, mean Jaccard 0.878.

## 3A. Canonical Node List

#### 1. Threshold foreclosure
- **definition**: The deployment's first and largest foreclosure occurs before the world opens — at install/compatibility/sign-in (Windows-only build, download labor). Install and hardware complaints belong overwhelmingly to the video-only stratum (4.7 and 4.4 vs 0.6 and 0.9 per-100 app-user responses) [FE]; read as an A₀-before-the-world design condition the dev/QA vantage could not see [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-01
- **centrality**: core
- **aliases**: approach to the world, availability as design condition, A0 gate

#### 2. Video-only stratum
- **definition**: ~43–46% of every term used only the YouTube fallback (Q8), term-stable (Cramér's V = .009, N=231) — a structural feature of the deployment, not a term accident [FE].
- **type**: POPULATION-STRUCTURE
- **units**: vle-01, vle-05
- **centrality**: core
- **aliases**: VID stratum, fallback population

#### 3. Two flight anatomies
- **definition**: The flight to video splits into excluded flight (Q7-No ∧ video-only, n=61: could not run the build) and hassle flight despite access (Q7-Yes ∧ video-only, n=47: "not worth the effort… when I could just pull it up on youtube") [FE]; the latter read as a Zeitvertreib-shaped exit replaying P3's convenience finding at scale [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-01, vle-05
- **centrality**: core
- **aliases**: hassle flight, excluded flight, fallback anatomy

#### 4. A₃→A₄ stall
- **definition**: The environment affords at interest/content (D2: 159 mentions, 21 with incorporation-positive co-codes) and forecloses at action (D3: 36 mentions, zero incorporation-positive co-occurrence; 51 explicit interactivity requests; "just being playback of videos") [FE]; the chain solicits at A₂/A₃ and withholds completion at A₃→A₄ — the seed-read's predicted first-form-boredom risk, student-attested [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-01, vle-05
- **centrality**: core
- **aliases**: nothing to do, action under-affordance, passive playback stall

#### 5. Friction-prediction scorecard
- **definition**: The Wendt seed-read's predicted foreclosures tested against complaint counts: latency CONFIRMED (27), navigation CONFIRMED (25, ∧guidance-requests 7), darkness weakly attested (4), proximity weakly attested (2), avatar occlusion UNATTESTED with conditions removed by solo desktop use; unpredicted threshold frictions dominate (crash 24, install 22, hardware 22) [FE].
- **type**: TEST-RESULT
- **units**: vle-01
- **centrality**: core
- **aliases**: falsifiable design test, seed-read verdicts

#### 6. Value-skepticism arc
- **definition**: As frictions declined across terms (crash 17→3→4), the complaint changed kind — from "it doesn't work" to "why not just YouTube?" (term-neutral sweep: 1.3 / 0.7 / 4.2 per-100) [FE]; read as the deployment maturing from form-1 culprits to a justification-demand no bug-fix answers — the design brief's motto [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-01
- **centrality**: core
- **aliases**: why-not-YouTube question, justification demand, gimmick verdict

#### 7. Divergence register
- **definition**: 18 within-response praise∧hollowness candidates; on §D-grid inspection most resolve into form-1 (determinate culprits: quality, lag), leaving a small genuine second-form residue without nameable culprit (e.g., "allows for more immersion, wasn't the highlight of the course") and one within-respondent pair (W26-R037) [FE counts; P sorting].
- **type**: FINDING-STRUCTURE
- **units**: vle-01, vle-03
- **centrality**: supporting
- **aliases**: A4-DIV register, praise-yet-hollow

#### 8. Screen-route presence
- **definition**: Presence talk concentrates in app-users (4.3 vs 1.2 per-100; Q8 immersion-Yes ≈69% of app-users, echoing P3's 70%): "The virtual space feels like you are in it, while just a video doesn't" [FE] — world-disclosedness candidacy attested on the desktop route, presence ≠ incorporation [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-01, vle-03, vle-05
- **centrality**: core
- **aliases**: desktop presence, 2D-route disclosure

#### 9. Optative co-disclosedness
- **definition**: Shared-involvement talk (E-SHA, 67, rate-stable) is dominantly a want, not a report: "more collaboration," "seemed isolating," "the main pro… you can watch with others" [FE]; the async-online course starves the WE and students ask the virtual world to supply it [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-01, vle-03, vle-05
- **centrality**: core
- **aliases**: the wanted WE, co-disclosedness as demand

#### 10. Felt-duration dilation
- **definition**: In the lab raw record, felt duration exceeds the 17-min actual in 16/24 video-episodes across ALL stimulus types (clinical median 20; boring up to "1 hour") [FE-U]; dilation tracks the being-held structure, not the stimulus category — Hingehaltenheit as the corpus's cleanest temporal datum [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-02
- **centrality**: core
- **aliases**: time dilation, the long while (empirical)

#### 11. Sleep-collapse limit case
- **definition**: One subject fell asleep during the boring stimulus and felt it as five minutes — shorter than actual [FE-U]; where dilation signals wakeful being-held, sleep is boredom's escape, not its maximum: the entranced while requires a held witness [P]. Methodological yield: felt-duration probes saturate at the sleep boundary; classifiers need a sleep-exit terminal category.
- **type**: FINDING-STRUCTURE
- **units**: vle-02
- **centrality**: supporting
- **aliases**: S05 case, exit by sleep

#### 12. Within-instrument divergence
- **definition**: One subject reports the same stimulus as boredom 6–7 AND engagement 6–7 simultaneously (clinical and interesting videos) [FE-U]; given two questions instead of a bipolar scale, the two layers speak separately — a second-form-shaped answer sheet corroborating the two-channel rule inside self-report itself [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-02
- **centrality**: core
- **aliases**: S07 double-high, bipolar refusal

#### 13. Stimulus non-essentialism
- **definition**: Inversion cases — the clinical stimulus rated 9-bored by a depleted subject whose following Word-tutorial episode was 7-engaged and restorative (fatigue 7→1); another subject bored by the "interesting" stimulus within a minute [FE-U]; the same stimulus is boring, engaging, restful, or intolerable by the episode's temporal-dispositional situation — the cause-effect and object-property schemata fail exactly as FCM's first-form analysis dismantles them [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-02
- **centrality**: supporting
- **aliases**: S04 inversion, rote relief

#### 14. Depletion carryover
- **definition**: Boring viewing raises post-episode fatigue in 6/8 subjects (up to 3→8) [FE-U], corroborating P2's published order-change rationale [FE]; boredom depletes — the aftermath FCM leaves untheorized, and the one bridge lane running lab→philosophy; triangulates with attention residue (Mark p. 97) [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-02
- **centrality**: core
- **aliases**: exhaustion carryover, boredom aftermath

#### 15. Published efficacy percentages (W25)
- **definition**: P4's first published positive-efficacy datum for the VLE itself (N=121 enrolled / 113 surveyed, Winter 2025): 83.19% able to use the platform, 62.83% reporting increased immersion/presence/embodiment, 65.49% saying the videos substantially enhanced their ability to examine how healthcare is performed, 64.6% recognizing cross-country clinical differences [FE]; the efficacy pole of the same VLE the deployment survey (vle-01) reads for friction/foreclosure [P].
- **type**: TEST-RESULT
- **units**: vle-05
- **centrality**: core
- **aliases**: efficacy percentages, W25 survey results, platform-usable rate

#### 16. Five learning themes (global immersion)
- **definition**: Thematic analysis of 94 W25 responses yields five learning themes — (1) resource disparities, (2) cultural/systemic factors, (3) procedural understanding (cataract "delicate"), (4) importance of collaboration/team coordination, (5) BME innovation connections [FE]; the qualitative efficacy record, with strong student verbatims per theme [FE-STUDENT].
- **type**: FINDING-STRUCTURE
- **units**: vle-05
- **centrality**: core
- **aliases**: qualitative themes, learning-outcome themes, five themes

#### 17. Interactivity-remedy pivot (efficacy ↔ interactive VLE)
- **definition**: The authors' own discussion diagnoses the passive-playback ceiling and names interactivity as the remedy — "engagement alerts will be integrated to address student feedback on boredom," alongside real-time quizzes and narrated modules, informed by cognitive-engagement/retention research [FE]; this is vle-01's A₃→A₄ stall (node 4) surfacing in the deployment's own voice, and the load-bearing tie between pedagogical efficacy and interactive design [P].
- **type**: FINDING-STRUCTURE
- **units**: vle-05
- **centrality**: core
- **aliases**: boredom remedy, engagement alerts, interactivity ceiling, efficacy-interactivity tie

#### 18. Scaled ABET deployment (capstone prerequisite)
- **definition**: The W25 course is a redesigned one-unit asynchronous online class, now a prerequisite for the UCI BME senior capstone, delivering global clinical immersion (UCI MC + CHOC + Vietnam + Paraguay) to satisfy ABET Student Outcomes 2 and 7; platform in Unreal Engine with real-time voice chat + screen sharing ("collaborative team viewing"), 3.3 GB, YouTube/vr.uci.design fallback [FE].
- **type**: DEPLOYMENT-FACT
- **units**: vle-05
- **centrality**: core
- **aliases**: capstone prerequisite, scaled deployment, ABET SO2/SO7, Unreal Engine platform
