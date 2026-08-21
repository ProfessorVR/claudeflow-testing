# Part III — Reanalysis & Rough-Draft Execution Plan

**Version:** v1.4 (2026-07-06) — **G0 PASSED** ("Looks good to me," user 2026-07-06). Phase 1 executed same day; **G1 pending** (application memo + crosswalk + codebook + style bands await user review). Revisions logged at bottom.
**Scope:** the dissertation's final part. Reanalyze the three King–Salvo experiments and the multi-term VLE survey corpus through the rhetorical-ontological / phenomenological methodology, to explain the student experience — why elements of a virtual learning environment engage or bore — informed by Heidegger's theory of boredom, and to derive design principles for better VLEs. Ends in a FCDP-drafted rough draft of Part III.
**Recon basis:** four-agent sweep 2026-07-06 (publications/index · survey CSVs · boredom report/FCM entry · RODA/Wendt/Part-II state). Findings integrated below.

---

## 0. Mission and governing idea

Part III's threefold goal (locked 2026-06-19):

1. **Boredom** — analyze student boredom phenomenologically and rhetorical-ontologically; the empirical data yields the conclusions, the frame explains HOW and WHY they arose.
2. **Engagement** — analyze student engagement in the VLE and assess the subjective surveys and results using the author's own methodology.
3. **Design** — show that, so informed, we can design more effective virtual learning environments.

The governing idea the recon confirmed is already built and waiting: the empirical program's own trajectory (EEG demoted as noisy → eye-tracking elevated → phenomenological method adopted) and its central anomaly — **2023 EEG reads the clinical video as boring-like while 2024 gaze-variance reads it as engaging-like (p = 0.0004), with self-reported engagement high and felt time dilated** — is not noise but the exact signature of Heidegger's **second form of boredom** (occupied surface, hollow depth), detectable only as the *disagreement of a surface channel and a depth channel*, never by a bipolar engaged↔bored scale. That keystone (already argued in `fcm-king-salvo-bridge.md` and the 17pp report) is Part III's analytic engine. The survey corpus and the new footage extend it from the lab to the live deployment.

---

## 1. Materials inventory (as found, 2026-07-06)

### 1.1 The three publications — `corpus/Virtual Learning Environments/`
| # | Paper | Venue | Evidence role |
|---|---|---|---|
| P1 | "WIP: Physiological Assessment of Learning in a VR Clinical Immersion Environment" (King, Feeney, Tang, Das, Salvo) | ASEE 2023 #37129 | Depth channel (EEG/DMN, N=3, only S1 clean → corroborating only) + clean felt-time dilation (S1: 17-min clip felt 25–30 min) |
| P2 | "Assessment of Student Engagement in VR Clinical Immersion Environments through Eye Tracking" (King, Lo, Das, Salvo) | ASEE 2024 #44685; UCI IRB Exempt 2023-2678 | Surface channel (gaze, N=12; clinical-vs-boring p=0.0004) + the high-arousal "searching gaze" vs low-arousal "zombie stare" distinction |
| P3 | "Phenomenological Evaluation of an Undergraduate Clinical Needs Finding Skills Through a VR Clinical Immersion Platform" (King & Salvo) | *Biomed Eng Educ* 4 (2024): 381–397 | Lived-experience leg (BME 179 spring 2022, N=22/20): presence 70% yet 40% judge plain 2D most beneficial; "hassle"/convenience flight; expert disenchantment. Salvo conceived/conducted/analyzed the surveys and interviews — the phenomenological method is the dissertation author's own |

**Index status:** no first-class entry. Analyses live as **bridge-sources digests** under the FCM entry (3 digests + `fcm-king-salvo-bridge.md` + `fcm-boredom-attunement-manual.md`) and pointers under Wendt. Not machine-queryable in `compiled-index.json` (no King–Salvo nodes; folded in only as 11 `anticipatory-application` edges). The dissertation draft (§§1.0–1.5) does not cite any of the three papers yet.

### 1.2 The survey corpus — `corpus/Virtual Learning Environments/VLE_Survey_Data/` (NEW, unanalyzed)
- **Three terms** — Winter 2025 (N=102), Spring 2025 (N=79), Winter 2026 (N=60); **total N=241**; single section each; attempt=1; unique IDs; Canvas Item-Analysis + Student-Analysis exports per term.
- **One stable 14-item instrument, identical wording and order in all three terms** (only Canvas QID prefixes differ): 3 graded content items (Q1–Q3, global-healthcare material) · 1 survey preamble (Q4) · **6 VLE-experience items (the dissertation gold): Q5 most-useful (open), Q6 improve (open), Q7 able-to-use-VR (Y/N), Q8 immersion/presence/embodiment (Yes / No / "I utilized the YouTube videos only"), Q9 elements-to-add (open), Q10 VR use-cases (open)** · 4 demographics (Q11–Q14).
- **Open-text volume:** ~87–95% response rates; ≈**870 free-text responses** across the four open items × three terms; mostly 10–50 words; at least one Korean-language response (multilingual handling needed).
- **Deployment context (AUTHOR-SUPPLIED 2026-07-06 — overrides what the instrument alone can show):** by these terms the course had **moved to a 2D PC-based experience as the primary modality**, because scaling VR to a full-size, fully-online, asynchronous class was not feasible. VR remained *available*, but the surveyed students **almost certainly used only the 2D PC version**. The instrument still brands the app "the VR platform" (Q7/Q8), so those answers are responses to the **3D environment experienced on a desktop screen** — an instrument-vs-deployment terminology gap the analysis must state. Effective strata: **interactive desktop-3D users vs video-only users** (Q8 "YouTube videos only" ≈ 43–46% every term; Q7 app-use ≈ 67–77%; immersion-Yes among app users ≈ 64% / 82% / 67% by term — read as *screen-based* presence reports). Internal clues corroborate: a Winter 2026 student *requests* headset provisioning; avatar mentions fall to zero by W26; desktop-crash complaints dominate the tech-failure vocabulary.
- **Quality/cautions:** PII columns (`name`,`id`,`sis_id`) + instructor named in open text; multi-line quoted fields (real CSV parser mandatory); Item-Analysis stats mostly artifacts (survey items force-keyed; W26 Cronbach α=1.092 impossible → discard IA reliability); content items at ceiling (0.98–1.00) → **no usable performance channel**; open-text non-response 5–13%; `Zone.Identifier` NTFS artifacts (inert; can delete).
- **The expected 4th quarter is absent** (planning docs repeatedly say "the 4 quarters of student data"); gap candidates: Fall 2025 or Spring 2026 (→ Decision O-1).

### 1.3 The boredom apparatus (complete, reusable)
- **Report:** `tmp/heidegger-boredom-report/report-fcm-boredom.html` (+17pp PDF) — faithful exposition of FCM §§16–39 with triple loci (book/GA/pdf; `book = 2·pdf − 24` left / `−23` right; GA read from running heads, never computed) + projected Part IV (three-form mapping, keystone, **six design implications**, category caution, faithful/projected ledger, tensions). A 22-quote citable bank with loci was extracted during recon.
- **FCM entry:** 15 units (core cluster **fcm-03…06** = §§16–36: awakening-method + the three forms; fcm-04 = *Zeitvertreib*/temporality anchor; fcm-05 = the keystone second form), `fcm-king-salvo-bridge.md` (the payload), **`fcm-boredom-attunement-manual.md` §D = an operational three-question diagnostic grid** (determinate culprit? → surface/depth divergent? → *Zeitvertreib* ceased + time stretched?) with observable-signature table, §E open problems.
- **Standing rules to inherit verbatim:** the **two-channel divergence rule** (second form detectable only as surface-vs-depth disagreement); **ascertaining ≠ awakening** (instruments read comportment, the *Zeitvertreib* layer; the second-form subject *sincerely denies* boredom → self-report caution); **never infer depth from a single surface index**; **beware the instrument that levels** (bipolar scales under-detect the zombie stare); **category caution** (a 17-min video ≠ *Grundstimmung*; the *structural grammar* transfers as heuristic — form 1/2 cleanly, form 3 only as phenomenology-under-analogy); provenance tags FAITHFUL-HEIDEGGER / FAITHFUL-EMPIRICAL / PROJECTED throughout.

### 1.4 The design lens (user-designated FIRST STOP for all design considerations)
`corpus/index/Wendt - Design for Dasein/`: payload A **`dfd-vle-design-manual.md`** (ten stance-principles; **the VE reading grid by chain node** A0/A1 · M1→A2 · M2→A3 · A3→A4 · A4+loop, scored affords/neutral/forecloses; Ihde mediation typology; (re)design playbook; limits) + keystone **`dfd-rhetorical-ontology-bridge.md`** — thesis: *designing a virtual environment = designing the conditions under which the participant's actualization-of-desire chain runs (engaged) or stalls (bored)*. The **BME-VLE seed read** (`bme-vr-env-analysis/bme-vle-read.md`, dev/QA capture) already diagnoses concrete frictions — **dark rooms, avatar occlusion, must-stand-close, buffer latency, double mediation, broken-elevator wayfinding** — mapped to chain-node foreclosures with a stated first-form-boredom risk at A3. **These are falsifiable predictions the survey corpus can now test.** Wendt's own bridge says empirical confirmation "awaits the student data" — that data has arrived.

### 1.5 The method stack and Part II inheritance
- **RODA canonical = v9** (`CANONICAL-METHODOLOGY-v9.md`, 2026-06-26; NOT v5/v6 — the Wendt crosswalk's v5/"ADA" citation is stale and needs a one-line reconciliation when touched). THE-MATRIX worksheet synced to v9. **Canonical RODA assumes a recorded play episode; it has no survey/self-report provision** (only the demoted historical DIA file admits interviews/think-alouds).
- **User bound (2026-07-06): RODA is useful only for analyzing — and only to a limited extent — the player experience with the environments.** See §3 methodology hierarchy.
- **Part II inheritance:** combined doc §2 five movements (`Part-II-COMBINED-v2-2026-07-01.tex` L213–264) + justification layer (`Part_II/methodology/RODA…DRAFT-v3`) + **`tmp/Dissertation/Appendices/`** (GLOSSARY, Calleja PIM/R1–R7, Burke pentad, Burke–Calleja crosswalk). Locked vocabulary: **world-disclosedness / co-disclosedness**, **phantasia-load** (the smaller the data a medium delivers, the more the beholder's own image-making must contribute), **rhetorical incorporation** (substantial union at A₃→A₄; emphatically not a change of kind), veri(dis)similitude, three-kinds firewall, media-general mechanism + route-differences (differential axes: data-discrepancy/phantasia-load; control-scheme/kinesthetic naturalization; rupture poles).
- **No written Part III exists** — no directory, file, or outline anywhere; no I/II/III master outline. Part I = "Rhetorical Phantasia" (six `-v3.tex` sections). Part III's goals live only in `plans/wendt-design-for-dasein-analysis.md`. This plan supersedes that file as the Part III execution reference (that file remains the Wendt-entry build record).

### 1.6 Newly arrived data (inventoried 2026-07-06) + still outstanding
- **Boredom-experiment RAW DATASET — ARRIVED** at `D:\PhD\Dissertation\Boredom Experiment\` (WSL: `/mnt/d/PhD/Dissertation/Boredom Experiment/`; **92 GB**). Far more than footage — the complete experimental record:
  - **`Subjects/` — 8 subjects** (named directories → anonymization map S01–S08 required before any artifact; three carry a "(Med)" marker — meaning to confirm). Per subject: **`EEG/`** (.mat raw data, 24 files total), **`HMD/`** (headset telemetry — gaze/pupil), **`OBS/`** (session screen recordings), **`Images/`**, **per-subject survey responses** (`Survey - <name>.txt`, 8 files — primary self-report data incl. the felt-time reports), plus some state-labeled per-subject clips (e.g. `Boring_Focused_*.mp4`, `Boring_Bored (EC,HA,LA)_*.mp4`). File census: 175 MATLAB .fig analysis figures, 47 .csv, 24 .mat, 19 .mp4, 8 .txt, 1 .xlsx, 1 .avi.
  - **`Videos/` — 10 state-contrast compilations** (June 2023; 124 MB–2.5 GB each): naming key (user 2026-07-06): **CLC** = clinical video, **INT** = interesting (alien-reproduction-vehicles), **Boring** = MS-Word tutorial; **LA/HA** = low/high arousal; **IE** = intense engagement; **AS** = attention span (graded); observed additionally: **E** = engagement, **ME** = moderate engagement, **EC** = eyes closed (user-confirmed 2026-07-06). Files: `B-AvsIE_Clip`, `Boring_LAvsEngagement`, `Boring_LAvsHA`, `CLC - IE vs E & Attention Span`, `CLC_HAvsE`, `CLC_HAvsME-A_Clip`, `INT_LA,ASvsIE`, `INT_LA,AvsIE`, `LAvsHA_Clip`, `LAvsIE_Clip` — the team's own state-classification work product, i.e. pre-labeled comparison evidence.
  - **Scale note:** N=8 subjects exceeds P1's published N=3 — the set likely spans both studies and may include **unpublished subjects** (two subject names match paper co-authors). Mapping + consent scope → Decision O-10.
  - **Opportunity:** raw EEG (.mat) + HMD gaze for the same subjects = the two channels of FCM design-implication #1 — the **surface–depth disagreement index could actually be computed**, not merely proposed. Scope → Decision O-9.
- **Gloria Mark, *Attention Span* (2023) excerpts — ARRIVED + initial analysis DONE** (user-ordered 2026-07-06): `corpus/Virtual Learning Environments/Gloria Mark - Attention Span (2023) [Quotations and screenshots].pdf` (12 pp OneNote export; typed notes + book-page screenshots; page number follows each block). **Catalog + integration digest built:** `tmp/Dissertation/Part_III/sources/mark-attention-span-quotation-catalog.md` (38 cataloged items, three provenance registers MARK-VERBATIM / AUTHOR-PARAPHRASE / AUTHOR-NOTE; two blocks page-unmarked → verify). Role: §III.0 literature-review justification (analyzing engagement with digital artifacts; improving attention span using them) — see Phase 1C.
- **Still outstanding:** 4th survey quarter (→ Decision O-1); deployment-history remainder (→ O-2); boredom naming-key confirmations + subject/paper mapping (→ O-10).

---

## 2. Recon findings that shape the design

1. **The keystone survives its weakest instrument.** Even discarding the N=1-clean EEG entirely, the second-form divergence rests on felt-time dilation vs gaze engagement. Part III can lean on it without over-claiming (ledger: lean on N=12 gaze + clean time-dilation + the team's own high/low-arousal distinction; hold back EEG as corroboration, P3's presence/preference split as analogy).
2. **The survey is a single self-report channel.** By the two-channel rule it cannot certify second-form boredom alone. The exhaustive analysis therefore hunts **within-corpus divergence pairs** — e.g., Q8 immersion-Yes against the same respondent's open-text monotony/hollowness ("The actual idea of having the VR clinic is amazing, the videos and images that come with it not so much"); Q7-yes users who nonetheless fell back to YouTube-only — and otherwise codes **first-form determinate culprits** honestly (crash, bug, lag, navigation, darkness, proximity, latency) plus surface engagement. The 43–46% YouTube-only flight is P3's "hassle" pattern replaying at scale — a *Zeitvertreib*-shaped exit route and a first-form diagnostic goldmine.
3. **The corpus has two empirical poles, mirroring Part II's architecture.** The lab studies and the 2022 pilot supply the **VR pole** (P1–P3: headset/360 immersion); the 2025–26 live deployment supplies the **2D-PC pole** (author-confirmed: surveyed students almost certainly desktop-only). Within the deployment, the surviving contrast is **interactive desktop-3D vs passive video** — still a phantasia-load/agency gradient, with the HMD pole imported from the earlier studies rather than from survey strata. Part III thus inherits Part II's G&G↔RDR2 differential apparatus with its own empirical poles (route, not kind), and the design chapter gets its comparative spine.
4. **The deployment history itself enacts P3's central finding.** P3 found presence favors VR while preference favors 2D (convenience 44.5%, discomfort 38.9%, the library-headset "hassle"); the course then institutionalized exactly that resolution — moving to 2D-PC primary for feasibility at scale. Presence≠preference, resolved at the level of course design. First-rate material for §III.5: feasibility/availability as an A0-level design condition (the horizon the institution can actually furnish), and the honest frame for why the 2D route is the one that must be designed well.
5. **Content items are at ceiling** (0.98–1.00) — no performance channel exists in the survey; do not pretend otherwise. Item-Analysis psychometrics are artifacts; exclude.
6. **The Wendt seed read made predictions before seeing student data.** Testing the predicted friction catalogue (darkness, occlusion, proximity, latency, wayfinding) against Q6/Q9 complaint frequencies is a genuinely falsifiable move — and the strongest possible warrant for goal #3 (the frame predicted where the environment would stall).
7. **Cohort composition differs by term** (W25 junior-heavy; S25 mixed; W26 mostly junior) and tech-failure vocabulary is richest in W25 — term comparisons need composition caveats.
8. **RODA's own protocol agrees with the user's bound:** it wants an episode (recording/trace). The footage is the one dataset where bounded RODA episode reads are legitimate; the survey is not.

---

## 3. Methodology hierarchy (per user recalibration 2026-07-06)

| Engine | Role in Part III | Instrument |
|---|---|---|
| **FCM boredom apparatus** | PRIMARY analytical engine for boredom/engagement reanalysis | Manual §D three-question grid + signature table; two-channel divergence rule; three-form structural grammar; six design implications; provenance ledger |
| **Wendt design lens** | PRIMARY design engine (goal #3); user-designated first stop for all design considerations | Reading grid by chain node (affords/neutral/forecloses); ten principles; Ihde typology; (re)design playbook; BME friction predictions |
| **RODA v9** | SUPPORTING, bounded: player/student experience-with-environment episodes only (footage reads, experiential vignettes). No full MATRIX walkthroughs on survey items | A₀→A₄ episode trace; union diagnosis; vocabulary (channels, ratios, *bia* vs *technē*-hexis capture, recalcitrance) |
| **Part II apparatus** | Connective tissue and vocabulary authority | A₀→A₄ spine (shared by all three lenses); rhetorical incorporation; world-/co-disclosedness; phantasia-load; differential axes |

**Terminology guardrails (standing locks):** *attunement/Stimmung* — never "emotion" — for *Langeweile*; hexis ≠ habit ≠ doxa; compulsion = *bia* ≠ addiction; ungendered subject noun (proposal: **"student"** in deployment contexts, "participant" in lab contexts, "player" reserved for game analyses → Decision O-6); Greek faculty-names; coined-compound restraint; no bold run-in heads; no explicit back-references.

---

## 4. Privacy and ethics (must precede analysis artifacts)

- Raw CSVs contain student `name`/`id`/`sis_id` and instructor-identifying text, and `corpus/` is a git-tracked tree. **Before any derived artifact is written:** (a) add `corpus/Virtual Learning Environments/VLE_Survey_Data/` to `.gitignore` (or relocate raw data outside the repo — user choice, Decision O-5); (b) generate **anonymized derivatives** (respondent codes `W25-R001`…; names/IDs dropped; instructor references generalized) and use ONLY those in analyses, index entries, and quotations. The instrument itself promised students "completely anonymized" — the pipeline must honor it.
- P2 carries UCI IRB Exempt 2023-2678; course-survey data is instructor-held educational data — flag for the user to confirm no additional IRB constraint applies to quoting anonymized student comments in the dissertation.
- Delete the six inert `Zone.Identifier` artifacts (cosmetic; with user's OK).

---

## 5. Phases

**Gate discipline:** each gate = show evidence, wait for user sign-off (no self-verify-and-commit). Backups to timestamped `.backups/` before modifying any existing file. Part III workspace: `tmp/Dissertation/Part_III/` (mirrors Part II convention).

### Phase 0 — Recon & plan (DONE 2026-07-06)
This document. **GATE G0: PASSED 2026-07-06.**

### Phase 1 — Foundations (two parallel tracks)

**1A. Methodology-application memo + codebook — DELIVERED 2026-07-06, awaiting G1** → `tmp/Dissertation/Part_III/methodology-application/` (`application-memo.md` · `construct-crosswalk.md` · `codebook-v1.md`)
- `application-memo.md`: how each engine applies to each data type (survey text / closed items / P1–P3 findings / footage), with the FCM standing rules and category caution written in as constraints; the RODA bound stated; the stale v5-crosswalk reconciliation note.
- `construct-crosswalk.md`: empirical constructs ↔ phenomenological categories, provenance-tagged. Spine: engagement metrics ↔ surface occupation; DMN/alpha ↔ depth; felt-time ↔ *Hingehaltenheit*; fallback-to-video ↔ *Zeitvertreib* flight; friction catalogue ↔ chain-node foreclosures (Wendt grid); presence language ↔ world-disclosedness; multiplayer/avatar mentions ↔ co-disclosedness; modality strata ↔ phantasia-load gradient.
- `codebook-v1.md` for the survey text — a priori code families:
  - **A. Boredom-form signatures** (form 1: determinate-culprit complaints — crash/bug/lag/navigation/darkness/proximity/latency/monotony-of-videos; form 2 candidates: within-respondent divergence, engaged-but-hollow phrasing, praise-of-idea-with-emptiness-of-execution; form 3: withdrawal/abandonment language) — coded as *phenomenological signatures*, never metaphysical claims (category caution).
  - **B. *Zeitvertreib* / flight patterns** (YouTube fallback, skipping, minimal-compliance use).
  - **C. Temporal texture** (drag, "long," tedium vocabulary).
  - **D. Wendt chain-node codes** (A0/A1 perceptual conditions; M1→A2 image quality/two-views; M2→A3 interest/meaning; A3→A4 action affordances incl. absent needs-capture; A4-loop return-use).
  - **E. Involvement-channel vocabulary** (kinesthetic/spatial/shared/narrative/affective/ludic — Calleja as vocabulary, not walkthrough).
  - **F. Incorporation-positive signatures** (presence, "actually there," exploration, world language).
  - **G. Suggestion taxonomy** (provisioning, optimization, content, interactivity, guidance).
  - **H. Emergent** (open).
- **GATE G1: user approves memo + crosswalk + codebook before any coding.**

**1B. Style calibration (user-ordered) — DELIVERED 2026-07-06** → `tmp/Dissertation/Part_III/style/` (`style-comparison-memo.md`; Part-I refresh CONFIRMS stored fingerprint — pooled avg 29.4w, voice .404, opacity .736, 83% Germanic; pubs pooled avg 17.5w, selfConsc .034; bands G/R/M proposed, confirm at G1)
- **Refresh the Part-I fingerprint** from the current six `-v3.tex` sections (`scripts/strip-latex-for-lanham.py` → `tmp/analyze-style-lanham.ts`) — mandatory FCDP precondition for Part-I-register use (stored fingerprint is stale by its own memo).
- **Fingerprint the three publications** (pdftotext → strip references/affiliations/captions/tables → analyzer), per-paper + pooled.
- Deliverable: `style-comparison-memo.md` — Part-I (refreshed) vs MA (clean pp.29–47 numbers) vs publications, across avgLen / short-long ratios / Germanic% / voice / periodicity / opacity / dynamicRange → **proposed per-movement G-A bands**: Part-I band (governing register) + reporting band (experiments-informed) + optional middle band for extended case-walkthrough passages (user accepts/rejects at each D1).

**1C. Gloria Mark lit-review integration (user-ordered; initial catalog DONE 2026-07-06)**
- DONE: full visual pass of the 12-pp excerpts PDF → `tmp/Dissertation/Part_III/sources/mark-attention-span-quotation-catalog.md` (38 items, provenance-tagged MARK-VERBATIM / AUTHOR-PARAPHRASE / AUTHOR-NOTE; page-per-block convention applied; two unmarked pages flagged).
- Remaining in 1C: resolve the two unmarked page numbers; add Mark rows to the construct crosswalk (attentional states ↔ three forms; rote ↔ second-form cousin; attention residue ↔ carryover/depletion; capture-economy ↔ phantasia-conscription/*bia*; Skinner ↔ differentiation obligation); mark the §III.0 movements that carry the two justification threads (analyzing engagement with digital artifacts — James anchor p.30, 47-seconds data pp.93–101, sensors-replace-surveys p.154; improving attention span by design — states-not-scalar pp.70–73, goal-strength p.80, residue/pacing pp.97–101).
- Style/registration: quotes enter drafting only as «Qnn» markers; final page verification against the book before compile (two AUTHOR-PARAPHRASE blocks are not quotable as Mark until verified). At Phase 3 the catalog is formalized into the VLE entry (`vle-mark-attention-span.md`).
- Dissertation-originality hook to preserve: P2's **high-arousal boredom** (searching gaze) empirically complicates the standard low-arousal account Mark inherits (her p.72 + nn.17–18) — FCM's first form names what that account misses.

### Phase 2 — Data completion & the exhaustive survey analysis

**2A. Boredom-dataset audit & ingest (data ARRIVED — see §1.6)**
- **T0 Audit + anonymization first:** full inventory of `/mnt/d/PhD/Dissertation/Boredom Experiment/`; subject anonymization map S01–S08 (kept OUTSIDE any tracked/shared tree); confirm remaining naming-key unknowns (AS grades, "(Med)", `B-A` prefix; EC = eyes closed, confirmed) and the subject↔paper mapping (O-10) with the user. Raw data stays on D:; only anonymized derivatives (transcripts, frames, reads, tables) enter the repo/index.
- **Per-subject survey .txt files:** transcribe → anonymized digests (the felt-time and engagement self-reports are load-bearing primary data for the *Hingehaltenheit* thread).
- **State-contrast videos (the 10 compilations + per-subject labeled clips):** probe durations/layout (ffprobe), then tiered ingest via the validated pipeline (ffmpeg + Whisper large-v3 on the 5090 — `~/.pyenv/versions/3.11.9/bin/whisper`; stop vLLM/embedder first via `scripts/god-launch stop`; 1280px frames). Products: contact sheets + a **comportment-layer read** per stimulus×state cell (searching gaze, watch-glance "helpless gestures," posture stillness, fidgeting = *Zeitvertreib* behaviors; zombie-stare stillness) + **bounded RODA episode reads** where a genuine actualization episode is visible. The team's own LA/HA/IE/AS labels are compared against the FCM three-state signatures (manual §D) — agreement AND divergence both reportable.
- **OBS/HMD/EEG holdings:** catalog only in Phase 2 (what exists per subject, durations, channels); analysis depth per Decision O-9 — from (a) qualitative epoch-alignment of existing .fig/.csv outputs up to (b) computing the per-epoch **surface–depth disagreement index** from raw .mat EEG + HMD gaze (design-implication #1 made real; Python `scipy.io` can read .mat — no MATLAB license needed).
- Output: `tmp/Dissertation/Part_III/boredom-dataset/` (audit memo, anonymized digests, comportment reads) — integrates as additional **surface channel** (comportment) and, if O-9(b), a computed divergence channel for Phase 4 triangulation.
- **4th quarter exports** (if it exists — Decision O-1): instrument is stable, so it slots in directly (only QID prefixes differ).
- **Deployment-history remainder from user** (Decision O-2, partially resolved 2026-07-06 — 2D-PC-primary era confirmed): timing of the 2D-primary switch relative to the three terms; build/version changes across terms; whether headsets were ever provisioned in a surveyed term.

**2B. Survey analysis** → `tmp/Dissertation/Part_III/survey-analysis/` (all on anonymized derivatives; raw untouched)
- **T0 Audit & anonymization:** parse with real CSV handling (multi-line fields); respondent codes; PII strip; translation pass for non-English responses (flagged as translated); audit memo (Ns, missingness, consistency checks incl. Q7×Q8 inconsistent pairs).
- **T1 Quantitative (descriptive + associative only — no causal claims; this is a course survey, not an experiment):** per-item distributions per term + pooled; **Q7×Q8 usage strata** (desktop-3D app users / video-only / non-users; per author, headset use ≈ nil in these terms — any stray VR self-identification in open text gets flagged, never assumed) and their term stability; strata × open-text theme rates; demographic splits with composition caveats; content items reported honestly as ceiling; IA psychometrics excluded with stated reason; χ²/nonparametrics + effect sizes only where they earn their keep. Deliverables: `01-quant-summary.md` + derived CSV tables.
- **T2 Qualitative coding (the exhaustive core):** all ≈870 open responses, coded against codebook v1; two full passes + negative-case search + saturation memo; adjudication log for pass disagreements; code counts + co-occurrence matrices (per term, per stratum); **exemplar quote bank** — verbatim-verified, respondent-coded, PII-free. Deliverables: `02-codebook-final.md`, `03-coded-corpus.csv`, `04-exemplar-bank.md`.
- **T3 Phenomenological diagnostics (the payoff):**
  - three-form diagnosis per theme cluster via the manual §D grid;
  - **divergence hunt** (the survey's second-form candidates): Q8-Yes ∧ hollow/monotony text; Q7-Yes ∧ video-fallback; praise-of-concept ∧ emptiness-of-execution;
  - **friction-prediction test:** BME-VLE read's predicted foreclosures vs observed complaint frequencies (per prediction: confirmed / disconfirmed / unattested);
  - **phantasia-load / agency contrast** between the deployment's two strata (desktop-3D vs passive video), with the VR pole imported from P1–P3 for the cross-case gradient;
  - Wendt chain-node scorecard from student text (affords/neutral/forecloses per node, with evidence counts).
- **T4 Findings memo** (`05-findings.md`) — feeds Phase 4. **GATE G2: user reviews T0–T4 outputs before index-entry write.**

### Phase 3 — Corpus formalization (index entry + registration)
- Create **`corpus/index/Virtual Learning Environments (King–Salvo)/`** (Pattern A: `_synthesis/` + `units/` + `bridge-sources/`; prefix `vle-`) as the single citable home for Part III's empirical corpus: survey-analysis units (per-item summaries, theme units, exemplar bank), footage-read unit, paper digest *pointers* (FCM originals stay canonical — no re-digest), the crosswalk, and a manifest with provenance discipline. (Architecture options in Decision O-3.)
- Register: add TEXT_DIRS entry in `scripts/compile-corpus-index.py` (code change → backup + diff shown), re-run compile, verify node counts. Re-run the verbatim-quote detector over any agent-written scholarly prose (FCM lesson: 56 violations caught last time). **GATE G2b: registration diff + quality report sign-off.**

### Phase 4 — Publication reanalysis briefs + cross-case synthesis → `tmp/Dissertation/Part_III/reanalysis/`
- **Boredom-experiment brief (P1+P2+footage):** source order per user — **report → index digests → PDFs** (pdftotext to .md; never read PDFs as images); tabulate constructs/findings with reliability flags; three-form re-reading; keystone restated with the ledger's lean-on/hold-back discipline; footage comportment integrated as third surface channel.
- **Deployment brief (P3 + survey):** presence≠preference at N=20 → its structural replay at N=241 (immersion-positive majorities among app users; video-only flight at scale); the institutional move to 2D-PC as P3's tension resolved at course level (feasibility as design condition); friction catalogue; engagement account via world-/co-disclosedness (the multi-user dimension: avatar/shared mentions and their disappearance by W26).
- **Cross-case synthesis (`synthesis.md`):** triangulation matrix (channels × studies × forms); the why-elements-bore account (temporal structures: drag, standing time, waiting-on-buffer; withdrawal of solicitation; foreclosed action at A3→A4); the phantasia-load gradient; the carryover/depletion open problem (the one place traffic runs lab→philosophy); explicit faithful/projected ledger for every claim.

### Phase 5 — Part III architecture → `tmp/Dissertation/Part_III/PART-III-OUTLINE.md`
Straw-man (order of §2/§3 undecided — Decision O-4):
- **§III.0** Introduction — from Part II's mechanism to the empirical cases; the reanalysis stance (not new experiments: a re-reading of published findings + primary data through the frame). **Literature-review anchor: Mark, *Attention Span* (2023)** — the two justification threads (attention constitutes experience [James, p.30] + the 47-second habitat [pp.93–101] + sensors-replace-surveys [p.154] ⇒ analyzing engagement with digital artifacts; states-not-scalar [pp.70–73] + goal-strength/residue ⇒ designing digital artifacts to improve attention). Includes the one-paragraph Skinner differentiation (designed-*Umwelt* ≠ behaviorist conditioning; the producing-art/using-art hinge keeps the agent).
- **§III.1** The method of reanalysis — application layer; two-channel rule; category caution; what each instrument can and cannot see (ascertaining ≠ awakening).
- **§III.2** The boredom experiment re-read — three forms in the lab; the keystone divergence; searching gaze and zombie stare as *Zeitvertreib* and its cessation.
- **§III.3** The VLE in deployment — engagement and its failures at N=241; the 2D-PC turn and its rationale; usage strata (desktop-3D vs video-only); friction catalogue; presence without preference.
- **§III.4** Why elements bore — cross-case synthesis; temporality of the stalled chain; the gradient.
- **§III.5** Design for better VLEs — Wendt playbook applied; the redesign of the BME platform; the three-state instrument proposal (the methodological payoff returned to the empirical program); the attention-capture counterpoint (Mark pp.154–165: the same instrumentation serves capture or care — Wendt principle 10 as the norm, the author's ambient attention-span-monitoring idea [AUTHOR-NOTE, catalog #24] as the constructive use); limits & future work.
Plus: master-outline stub for I/II/III (Decision O-7). **GATE G3: outline + target length approved.**

### Phase 6 — Drafting (FCDP v2 — user-locked 2026-07-06)
- Per section: pack (HEAD/MIDDLE/TAIL, saved to `plans/packs/`) → D1 movement plan **with per-movement style targets implementing the voice decision (below)** → D1.5 nucleus/satellite skeleton + counterargument pass → D2 with «Qnn» quote markers (quotes never generated; `scripts/substitute-quote-ids.py`) → 7-gate gauntlet → ≤3 revise cycles → verification-gated handoff.
- **Voice (user-locked, two-step, 2026-07-06): hybrid-by-zoning with the PART-I REGISTER GOVERNING** — the fully Lanham-trained Part-I voice (not the MA profile) for framing/interpretive/phenomenological/synthesis movements; a **plainer experiments-informed reporting band** for methods/results recaps (Ns, p-values, instruments); optional middle band offered per-section at D1. G-A calibrates against the **refreshed** Part-I fingerprint (Phase 1B), not FCDP §8's MA numbers. Honest cross-part note: Part II §4+ applications are MA-plainer by prior user lock; Part III will read more elevated than Part II's applications — chosen deliberately by the user, recorded here so it is never mistaken for drift.
- Apply FCDP calibration lessons: front-load suspended openers in D2 prompts; pass the verification log into G-E context; G-D greps extended with Part III locks (*Stimmung*/attunement, *bia*≠addiction, student-noun rule).
- **GATE G4: per-section user approval** (interactive per-¶ revision after each FCDP handoff, per established Part II practice; REVISION-PROTOCOL + session-degradation checklist in force).

### Phase 7 — Assembly & compile
Combined `Part-III-COMBINED-v1.tex`; XeLaTeX compile; citation verification at Gross-advisor rigor (FCM triple loci; paper page numbers; `******` placeholder discipline for anything unverified); appendices updates (GLOSSARY additions if any new coinages survive review — restraint default); backups; **verification-gated commit** (user sign-off; nothing self-committed).

---

## 6. Decisions

### Resolved this session (2026-07-06, by user)
| # | Decision |
|---|---|
| R-1 | **Drafting pipeline = FCDP v2** for the multi-stage draft/revision/redraft with curated prompts |
| R-2 | **Voice = hybrid-by-zoning; Part-I register (fully Lanham-trained) GOVERNS Part III**; plainer reporting band for data movements; MA profile not the governing register |
| R-3 | **RODA bounded** to player-experience-with-environment episodes, limited extent; FCM + Wendt carry the analysis |
| R-4 | **Wendt entry = first stop** for all virtual-world design considerations |
| R-5 | **Boredom-experiment footage will be added** to the system and analyzed (Phase 2A) |

### Open (need user input — none block G0 review itself)
| # | Question | Recommendation |
|---|---|---|
| O-1 | **4th survey quarter** — does Fall 2025 / Spring 2026 data exist to export, or are 3 terms final? | Obtain if it exists (instrument-stable, slots in directly); else proceed on 3 |
| O-2 | **Deployment history — PARTIALLY RESOLVED (user 2026-07-06):** the course moved to a 2D PC-based experience as primary (VR available but effectively unused) because full-size, fully-online, asynchronous VR did not scale; surveyed students almost certainly 2D-only. REMAINING: were all three survey terms already in the 2D-primary era (when did the switch happen)? Any build/version changes across the three terms? Were headsets ever provisioned in any surveyed term? | Confirm the remainder in one short note |
| O-3 | **Index-entry architecture:** (a) one combined `Virtual Learning Environments (King–Salvo)` entry (papers-pointers + survey + footage + analyses) vs (b) survey-only entry, papers stay bridge-sources | **(a) combined** — one citable home for Part III's empirical corpus |
| O-4 | **Section order:** engagement-first (§III.2=deployment) vs boredom-first (§III.2=lab experiment) | **Boredom-experiment first** — the lab keystone arms the reader with the two-channel rule before the deployment data needs it |
| O-5 | **Raw-data handling:** gitignore `VLE_Survey_Data/` vs relocate outside repo | gitignore + anonymized derivatives only in tracked trees |
| O-6 | **Subject noun:** "student" (deployment) / "participant" (lab) / "player" reserved for games | As stated |
| O-7 | **Master outline stub** for Parts I/II/III now (small doc) or defer to Phase 5 | Defer to Phase 5 (one doc, one review) |
| O-8 | **Target length** for Part III (Part II combined ≈ 47pp for reference) | Set at G3 with the outline |
| O-9 | **Boredom raw-data reanalysis depth:** (a) qualitative epoch-alignment using the team's existing .fig/.csv outputs + labeled videos, or (b) additionally compute the surface–depth disagreement index from raw .mat + HMD gaze | **DEFERRED — user decides at Phase 2A start** (user 2026-07-06) |
| O-10 | **Subject mapping & consent scope:** which of the 8 subjects were in which published study; meaning of "(Med)", B-A, AS grades; any constraint on unpublished subjects' data | **DEFERRED — user provides at Phase 2A start** (EC = eyes closed already confirmed) |

---

## 7. Conventions & guardrails (standing, all phases)
**Future-work posture (user 2026-07-06):** future-work passages anywhere in Part III (incl. §III.5's instrument proposal and monitoring idea) are **gestures, not plans** — draft them at one-paragraph scale in prose; do NOT design instruments, plan code, or spend analysis/computation effort on them.

corpus/index first, ChromaDB fallback · PDFs via `pdftotext` to .md, never as images · backups before changes (timestamped `.backups/`) · verification-gated: show evidence, wait for sign-off, no self-verify-and-commit · missing-source placeholder `******` · Perplexity verbatims verified against PDFs · major iterations on copies in `*-iterations/` · per-paragraph revision protocol for interactive passes · REVISION-PROTOCOL.md + session-degradation checklist at every revision session · verbatim-quote detector re-run after any agent writes quoted scholarly prose · provenance tags (FAITHFUL-*/PROJECTED/`anticipatory-application`) on every analytical claim · plan reviews multi-round in `plans/`.

## 8. Session map (estimate; parallelizable where marked)
| Session | Work |
|---|---|
| S1 | Phase 1A memo/crosswalk/codebook ∥ 1B style calibration → G1 |
| S2 | 2B T0–T1 (audit, anonymization, quant) ∥ 2A footage ingest when provided |
| S3–S4 | 2B T2 coding (≈870 responses, two passes) + T3 diagnostics + T4 memo → G2 |
| S5 | Phase 3 index entry + registration → G2b ∥ footage comportment read |
| S6 | Phase 4 briefs + synthesis |
| S7 | Phase 5 outline → G3 |
| S8+ | Phase 6 FCDP per section (≈1 section/session) → G4 each |
| Final | Phase 7 assembly/compile/citation pass → sign-off |

## 9. Key paths (for future sessions)
- Plan: `plans/part-iii-reanalysis-and-draft-plan-2026-07-06.md` (this file)
- Workspace: `tmp/Dissertation/Part_III/` (to be created at Phase 1)
- Data: `corpus/Virtual Learning Environments/` (3 PDFs + `VLE_Survey_Data/`)
- Boredom apparatus: `tmp/heidegger-boredom-report/` + `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/` (`_synthesis/fcm-king-salvo-bridge.md`, `_synthesis/fcm-boredom-attunement-manual.md`, `bridge-sources/king-salvo-*-digest.md`)
- Design lens: `corpus/index/Wendt - Design for Dasein/` (`_synthesis/dfd-vle-design-manual.md`, `_synthesis/dfd-rhetorical-ontology-bridge.md`, `bridge-sources/bme-vr-env-analysis/bme-vle-read.md`)
- Method: `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/CANONICAL-METHODOLOGY-v9.md` + `THE-MATRIX.md`
- Part II inheritance: `tmp/Dissertation/Part_II/Part-II-COMBINED-v2-2026-07-01.tex` + `tmp/Dissertation/Appendices/`
- FCDP: `plans/fable-console-drafting-protocol-v2.md`; style tools: `scripts/strip-latex-for-lanham.py`, `tmp/analyze-style-lanham.ts`, `scripts/substitute-quote-ids.py`
- Compile: `scripts/compile-corpus-index.py` (TEXT_DIRS)
- Boredom raw dataset: `/mnt/d/PhD/Dissertation/Boredom Experiment/` (`Subjects/` ×8 — EEG/HMD/OBS/Images/survey.txt; `Videos/` ×10 state-contrast compilations; 92 GB; PII — anonymize before derivatives)
- Mark catalog: `tmp/Dissertation/Part_III/sources/mark-attention-span-quotation-catalog.md` (source PDF in `corpus/Virtual Learning Environments/`)

---

## Revision log
- v1 (2026-07-06): initial plan from four-agent recon + five in-session user directives (FCDP, zoning, Part-I governing voice, RODA bound, footage task). Awaiting review round 1.
- v1.1 (2026-07-06): deployment context integrated (user): the three survey terms sit in the **2D-PC-primary era** — VR available but effectively unused; rationale = VR does not scale to a full-size, fully-online, asynchronous class. Survey strata reframed to desktop-3D vs video-only; two-pole architecture added (lab/pilot VR pole ↔ deployment 2D-PC pole, mirroring Part II G&G↔RDR2); institutional presence≠preference thread added to §2 and Phase 4; O-2 narrowed to the remaining three facts.
- v1.4 (2026-07-06): **G0 PASSED**; Phase 1 executed — 1A delivered (application memo w/ engine jurisdictions + standing rules + per-dataset protocols incl. DIV-candidate rule & friction-prediction test; construct crosswalk w/ channel taxonomy; codebook v1 families A–H + analysis contracts); 1B delivered (Part-I fingerprint REFRESHED from v3 tex, confirms stored numbers; 3 pubs + pooled fingerprinted; G/R/M bands proposed); new helper `scripts/strip-pdf-prose-for-lanham.py`. **G1 pending user review.** 1C remainder (unmarked Mark pages; crosswalk rows DONE in crosswalk §3) open.
- v1.3 (2026-07-06): EC = eyes closed confirmed; **future-work posture set** (gesture-level prose only — no instrument/code planning, guardrail added to §7); O-9/O-10 marked DEFERRED to Phase 2A start (user will decide there).
- v1.2 (2026-07-06): **boredom raw dataset arrived + inventoried** (§1.6: 8 subjects w/ EEG/.mat, HMD, OBS, per-subject surveys; 10 state-contrast videos w/ user's naming key; 92 GB) — Phase 2A rebuilt as full audit/ingest with anonymization-first; O-9 (disagreement-index computation depth) + O-10 (subject mapping/consent) added. **Mark *Attention Span* excerpts analyzed** (user-ordered): 38-item provenance-tagged catalog + integration digest built (`Part_III/sources/`); Phase 1C added; §III.0 lit-review anchor + §III.5 capture-economy counterpoint wired in; high-arousal-boredom-vs-Mark originality hook recorded.
