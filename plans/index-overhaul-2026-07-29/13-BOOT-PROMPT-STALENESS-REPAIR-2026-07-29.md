# BOOT PROMPT — Index staleness repair (O-9 reprocessing + O-10 resolution)

*Drafted 2026-07-29 by the lab-boredom-section session, which performed the partial repair that this one completes.
Analysis-only pass: every site below was verified on disk, nothing was modified in drafting this.*

---

## 0. What you are being asked to do

Two facts about the Boredom Experiment dataset changed. Ten index files and three dissertation-draft files still
assert the superseded versions. Your job is to repair them — correctly, in the right order, with the argumentative
one separated from the factual ones — and then to prove the repair actually landed in the runtime artifact.

**This is not a find-and-replace job.** Three of the sites are status fields where a string swap is right. One is a
keystone argument whose *structure* changed, and repairing it requires a conceptual decision that must go to the
author before you write anything. Do not batch them.

**Nothing gets committed.** The author signs off before any commit, always.

---

## 1. The two changes that made everything stale

### 1a. O-9 — three channels processed, and a published keystone did not survive it

On 2026-07-16 the boredom dataset's deferred channels were processed at full N=8 (`ch-eeg`, `ch-hmd`, `ch-fig`;
`ch-obs` remains deferred). Methods were taken from the two published papers rather than inferred: EEG montage
F3/F4/P3/P4, 1–35 Hz, boredom marker = DMN power in alpha (8–12) + theta (4–8), higher = boring-like; gaze feature =
variance of the 5-point-median Euclidean deviation from screen centre.

Within-subject z-scores, averaged across the cohort (higher DMN / parietal α / gaze variance = more boring-like;
higher cognitive load / pupil = more engaged):

| stimulus | EEG DMN | parietal α | gaze variance | cognitive load | pupil |
|---|---|---|---|---|---|
| **Boring** | **+0.48** | **+0.70** | **+0.21** | −0.19 | −0.69 |
| Clinical | −0.24 | −0.32 | −0.20 | **+0.33** | **+0.40** |
| Interesting | −0.24 | −0.38 | −0.01 | −0.14 | +0.30 |

**The consequence that matters.** P1's headline — *clinical EEG resembles the boring control* — came from its one
clean subject of three. **At N=8 it does not replicate.** Clinical's DMN power is *low* (engaging-like),
statistically indistinguishable from the interesting stimulus, and the boring-like reading holds in 4/8 subjects,
which is chance. Every processed physiological surface places clinical with the engaged pole.

**The corrected keystone** is therefore no longer *gaze-engaged versus EEG-hollow*. It is **all-physiology-engaged
versus self-report-bored** on the clinical stimulus — the physiology reads engaged across all five surfaces while
self-report rates it 6.0/9, between boring's 7.0 and interesting's 4.5. This is the stronger form, because it no
longer rests on the noisiest instrument.

**Statistics — report these correctly or not at all.** Only **pupil dilation** is significant at N=8 (Friedman
p=0.030; Boring < Clinical in all 8 subjects, Wilcoxon p=0.008 Holm-corrected, rank-biserial −1.0). Everything else
is directional only: EEG DMN p=0.20, parietal α p=0.22, gaze variance p=0.61, cognitive load p=0.61, HR p=0.20,
HRV p=0.61. **The evidence is the directional convergence across five channels plus pupil specifically — never
per-channel significance.** This phrasing is a standing rule; do not soften it in either direction.

**Two findings added 2026-07-29** that bear on the repair:
- **The stratum check.** `(Med)` is confirmed to mean *medical student* — the stratum P2's own published recruitment
  paragraph names. On the clinical stimulus the strata are indistinguishable (boredom mean 6.00 in both; pupil
  separation holds 3/3 and 5/5), so the prior-clinical-exposure explanation for the divergence is empirically
  answered.
- **The keystone decomposes unidirectionally.** At subject level: 4/8 divergent in the keystone direction, 2/8
  concordant-engaged, 2/8 concordant-bored, and **0/8 reverse** — nobody reads physiologically bored while
  reporting engagement. The asymmetry is a stronger claim than the cohort mean and belongs in the repaired bridge.

### 1b. O-10 — resolved; the consent ceiling is gone

Author ruling, 2026-07-29: **under the governing IRB protocol all findings are reportable except the subject's
name.** Both published papers cite one protocol (P1 prints "UCI IRB exempt No. 2678"; P2 prints "UCI IRB Exempt No.
2023-2678"), and the raw N=8 sits inside P2's twelve-participant consented pool. The former ceiling — aggregates
plus four cases, no per-subject matrix — **no longer binds.** The per-subject matrix may be reported Sxx-keyed.

**Unchanged and permanent:** the PII gate. Subjects are S01–S08 everywhere; no real name enters any file; the
name→Sxx crosswalk is never persisted (scripts derive Sxx at runtime from sorted folder order).

---

## 2. Read these before touching anything

**The two source-of-truth artifacts** (read fully — everything in §1 comes from them):
1. `tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md` — the processed channels, the
   corrected keystone, the full statistical picture, the honest caveats, and the new stratum section.
2. `tmp/Dissertation/Part_III/reanalysis/boredom-experiment-brief.md` — the FE-U master: the 24-episode
   per-subject self-report table, the aggregates, and the four load-bearing cases (S07 within-instrument
   divergence, S05 sleep-collapse, S04 inversion, S03 extremity).

**The sweep that found the work:**
3. `plans/index-overhaul-2026-07-29/12-STALENESS-SWEEP-2026-07-29.md` — the site list, and its own account of why
   this class of defect escaped. Read §12.3; it defines the gate you must satisfy at the end.
4. `plans/index-overhaul-2026-07-29/11-ANCHOR-REPAIR-2026-07-29.md` — the partial repair already performed, so you
   do not redo it or contradict its wording.

**The entry already repaired, as your wording precedent:**
5. `corpus/index/Boredom Experiment (VR Attention Study)/_synthesis/book-level-ontology.md` and
   `units/bex-00-corpus-overview.md`, `units/bex-02-eeg-workload.md`, `units/bex-03-gaze-arousal.md`,
   `units/bex-04-stimulus-corpus.md`, `_synthesis/manifest.json` — already corrected on 2026-07-29. Match their
   register and phrasing. **Note that four sites inside this same entry were missed and are yours to fix (§3, Wave A).**

**For the bridge repair specifically:**
6. `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/_synthesis/fcm-king-salvo-bridge.md` — read in
   full, twice. It is 88 lines and tightly argued; the repair is surgery on §§1/3/4/7/8, not a rewrite.
7. `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/bridge-sources/king-salvo-physiological-digest.md`
   — the canonical P1 digest; line 23 is stale and it is what directs a drafter's use of the EEG channel.
8. `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/units/fcm-04-first-form.md`,
   `fcm-05-second-form.md`, `fcm-06-third-form.md` — the primary-text units. **You will need fcm-05 to settle the
   conceptual question in §4 below.** Page-offset rule: `book_page = 2·pdf_page − 24`; cite the triple locus
   (book / GA / pdf); GA pagination drifts, so read it from the running head, never compute it.
9. `tmp/Dissertation/Part_III/drafts/DESKTOP-M4-DRAFT-v1.tex` ¶¶4–7 of M4.1 — the three-forms exposition in
   finished dissertation prose. It is the register the bridge's repaired §4 must be compatible with, and it
   contains one of the contaminated sites.

**For the concordance pass:**
10. `corpus/index/Boredom Secondary (Part III)/_synthesis/boredom-construct-measure-concordance.md` §§2, 4, 5.
11. `corpus/index/Boredom Experiment (VR Attention Study)/_synthesis/book-level-ontology.md` §3A — the seven real
    channel nodes the concordance's twelve pointers must now be resolved against.

---

## 3. The work, in four waves — do not merge them

### Wave A — factual status corrections inside the Boredom Experiment entry (4 sites, 3 files)

These are the ones the earlier repair missed. It corrected the O-10 **gate** statements and left four descriptive
mentions in other registers still saying the use is pending.

| File | Line | Stale text |
|---|---|---|
| `_synthesis/book-level-ontology.md` | 51 | the `ch-selfreport` §3A node definition — **"use pending O-10"** |
| `_synthesis/book-level-ontology.md` | 12 | provenance preamble — "FE-U … dissertation use pending **O-10** consent-scope confirmation" |
| `units/bex-01-selfreport-record.md` | 3 | "**Register:** FE-U (unpublished raw record; dissertation use pending **O-10**)" |
| `_synthesis/manifest.json` | 14 | `"raw_dataset": "… FE-U register pending O-10"` |

**Line 51 is the priority.** It is inside §3A, which is what the compiler harvests, and it is **verified present in
the live `compiled-index.json` right now**. The entry was edited, backed up, recompiled and verified as "no loss on
any axis" — and this superseded claim shipped anyway, because no-loss is not no-falsehood.

Recompile after this wave: `python3 scripts/compile-corpus-index.py`.

### Wave B — the VLE entry (4 sites, 4 files)

One consent-scope fact plus one EEG-status fact.

| File | Line | Stale text |
|---|---|---|
| `_synthesis/book-level-ontology.md` | 3 | "FE-U = faithful-empirical unpublished raw record, **use pending O-10**" — defines the register for the whole entry, and this file is compiler-read |
| `units/vle-00-corpus-overview.md` | 9 | **two** assertions: "Corroborating only: P1 EEG (N=1-clean)" and "FE-U (unpublished raw record) use pending O-10 consent-scope confirmation" |
| `_synthesis/manifest.json` | 15 | `"raw_dataset": "… FE-U register pending O-10"` |
| `units/vle-02-boredom-raw-dataset.md` | 3 | **three** assertions in one line: the `(Med)` marker "meaning unconfirmed → O-10"; "any `.mat` processing DEFERRED (O-9)"; "FE-U use in the dissertation pending O-10 consent-scope confirmation" |

Note the `vle-00:9` EEG line is stale in the *opposite* direction from the consent items: it demotes a channel that
is now processed at full N=8. Its replacement is not "lean on the EEG" either — the honest statement is that the
EEG is processed, converges directionally with every other surface, and is not significant at N=8.

Recompile after this wave.

### Wave C — the FCM bridge and its digest (2 files) — **ARGUMENTATIVE; STOP AND ASK FIRST**

`_synthesis/fcm-king-salvo-bridge.md` carries the superseded reading at eight places, not the five the sweep
listed. Verified sites:

| Where | What it says |
|---|---|
| §1, line 14 | the four-fact anomaly, item (i) "EEG that **resembles the boring control**" |
| §2, line 18 | P1's findings — "clinical EEG ≈ boring control [*suggestive*: only S1's EEG clean]" |
| §3 table, line 31 | second-form row's empirical correlate: "gaze ≈ engaged **yet** EEG ≈ boring" |
| §4 heading, line 42 | "Keystone — the cross-instrument contradiction *is* the second form" |
| §4 body, lines 44–50 | the whole channel mapping: gaze = surface, DMN = depth, self-report = caught between |
| §7.1, line 64 | the redesign: "surface–depth disagreement index = (gaze-engagement) − (DMN/alpha depth)" |
| §8 ledger, lines 77, 81 | "Clinical EEG ≈ boring" and "The EEG/gaze contradiction = a second-form surface/depth split \| **keystone**" |
| §8, line 84 | "Hold back: the 2023 EEG (treat as corroborating, not load-bearing)" |

Plus `bridge-sources/king-salvo-physiological-digest.md:23` — "the bridge must lean on the self-report + the larger
2024 gaze dataset, treating 2023 EEG as corroborating only."

**§2 line 18 is a special case: do not "correct" it.** The bridge's register discipline separates FAITHFUL-EMPIRICAL
(what the papers claim) from PROJECTED (the bridge's own mappings). Line 18 is an accurate report of what P1
published, and it must stay accurate as such. What is needed is an added layer, not an edit — see §5.

### Wave D — the concordance (1 file)

`boredom-construct-measure-concordance.md` carries **14** `****** UNVERIFIED:` markers. The sweep asked which two
were additional to the twelve channel pointers; the answer is that they are not extra pointers but the prose
bracketing the table: **line 104** (the header caveat, "the entry is **not yet built**" — it now exists) and
**line 124** (the gate-satisfied statement). Twelve are the table rows at lines 110–121.

Resolving them is not a mechanical unflagging. Against the anchor's seven real channels, roughly half the columns
resolve to a channel and the rest resolve to **documented non-coverage**: there is no EEG functional connectivity
in a four-electrode montage, no resting eyes-open/eyes-closed baseline protocol, no behavioural performance task,
and no classifier was built. Recording those as explicit non-coverage is the more valuable half of this pass — it
states precisely what the study cannot speak to, which is directly reusable as limitations material.

Leave §5's `predictive-processing model` column empty; it is a documented category error, not a gap.

---

## 4. The conceptual problem you must solve before rewriting §4 — take this to the author

The old bridge mapped **gaze = surface**, **EEG = depth**, **self-report = caught between**. That mapping is gone:
gaze and EEG now sit on the *same* side. The new divergence runs between **the physiology as a whole** and
**self-report**. So which is the surface and which is the depth?

This is not a wording choice. Heidegger's second form is an *occupied surface over a hollow depth*. The corrected
data has the body reading engaged and the person reporting bored. If self-report is the surface — which is exactly
what the approved dissertation prose currently makes it ("a written answer reports the surface, and the surface
really is occupied," M4.1 ¶6) — then the corrected finding is a *hollow surface over an occupied depth*, which is
the second form inverted, not instantiated.

Three candidate resolutions. Weigh them against `fcm-05-second-form` and FCM §§24–28 directly; do not settle this
from the secondary material.

**(a) Reassign the layers.** Physiology becomes the surface, since Heidegger's surface is outward comportment and
the dinner-party guest is described as *outwardly occupied*; self-report becomes the depth-report. Fits Heidegger's
own vocabulary for the surface, but strains the fact that his subject *denies* boredom while this one reports it.

**(b) Concede the fit.** The corrected divergence is a different structure and the clinical stimulus is no longer a
second-form site at N=8. Honest, and a major retreat — it would gut the bridge's payload.

**(c) Distinguish in-episode from retrospective.** The lab self-report is answered *after* each video, and
Heidegger's recognition also arrives afterward, at home ("I was bored after all this evening"). On this reading the
physiology is the in-episode occupation and the self-report is the later recognition of emptiness — which makes the
corrected finding a closer fit to the dinner party than the original mapping was.

**(c) looks strongest to the session that drafted this prompt, and it is the one to test first — but verify it
against the primary text and put the reasoning to the author before writing.** Whichever resolution is ruled, the
same formulation then has to propagate to §3's table row, §7.1's disagreement index, §8's ledger, the digest, and
the contaminated draft prose in §6 below.

**Two things that survive untouched and should be said so explicitly.** The first-form mapping (high-arousal
searching gaze as *Zeitvertreib* operationalized) is unaffected and is now corroborated at N=8, where Boring carries
the highest gaze variance. The third-form analog (the zombie stare) is unaffected. And §1's underlying argument —
that a bipolar engaged↔bored scale must discard one of the simultaneous facts — is *strengthened*, because S07 rated
the clinical film boredom-6 and engagement-7 at once, refusing the axis from inside a single instrument.

**Record the epistemic event rather than overwriting it.** §4 currently ends "This is the one claim the bridge most
wants tested." It was tested, at N=8, and came back partly refuted. A bridge that made a falsifiable prediction and
then recorded the result is worth more than one that reads as though it always said the right thing. Repair it as a
dated revision with the superseded reading preserved and marked, not as a silent replacement.

---

## 5. Register — the structural fix the bridge needs

The bridge declares three layers: FAITHFUL-HEIDEGGER, FAITHFUL-EMPIRICAL, PROJECTED. The reanalysis fits none of
them. It is not what the papers published, and it is not a projected mapping — it is a reprocessing of the same raw
data at larger N.

The rest of the project already uses **FE-U** (faithful-empirical, unpublished raw record) for exactly this. Add it
to the provenance-discipline block at the top of the bridge and tag every reanalysis claim with it. This is what
lets §2's published report stay accurate *and* the corrected finding sit beside it without contradiction — the two
are different registers making different claims, not a fact and its correction.

---

## 6. Contamination outside the index — FLAG, PROPOSE, DO NOT SILENTLY EDIT

The sweep covered the index. It did not cover the drafts. The superseded claim is **in the approved, assembled
dissertation prose** at three live sites:

| File | Line | Text |
|---|---|---|
| `tmp/Dissertation/Part_III/drafts/DESKTOP-M4-DRAFT-v1.tex` | 296–298 | "…as in the laboratory arm of this study, where a brain measure can read boring-like on the very footage a gaze measure reads as engaged." |
| `tmp/Dissertation/Part_III/drafts/DESKTOP-M3-DRAFT-v1.tex` | 883–884 | "The laboratory could set a brain measure against a gaze measure and let the two contradict each other…" |
| `tmp/Dissertation/Part_III/drafts/DESKTOP-SECTION-OVERLEAF-v1.tex` | 2163, 2485–2486 | flattened mirrors of both |

`DESKTOP-SECTION-ASSEMBLED-v1.tex` pulls M3 and M4 by `\input`, so the compiled 37-page PDF carries it too.

**These are approved text. Do not edit them on your own authority.** The M3 site needs only its two channels
renamed — its structural point (a survey holds one channel; the laboratory holds two) survives entirely. The M4
site needs one clause. But both must wait on the §4 layer ruling, since the replacement wording *is* the ruling.
Propose exact replacement spans, get sign-off, then apply, and re-flatten the Overleaf file and recompile the
assembled PDF afterward — the flattened copy is generated, not canonical, and goes stale silently.

The old FCDP-era `III-2-Laboratory-DRAFT-v1.tex` also runs on the superseded claim, but the arc ruling of
2026-07-29 supersedes that draft entirely. It needs a superseded-banner, not a repair.

---

## 7. Conventions, gates, and how to prove you are done

**Before touching any file:** timestamped backup to the entry's own `.backups/`. The precedent from the earlier
repair is `corpus/index/Boredom Experiment (VR Attention Study)/.backups/20260729-o9-status-repair/`.

**PII:** S01–S08 only, in every file, always. No real name anywhere. Never enumerate the raw `Subjects/` directory
into any output. The crosswalk is never persisted.

**Recompile** after any `§3A` node change: `python3 scripts/compile-corpus-index.py`. Relation edges in
`global-edges.csv` are *not* ingested; only §3A nodes and `*-tension-edges.json`. Edge-only changes need no recompile.

**The G19 gate — this is the point of the exercise.** After the final recompile, do not assert success from node
counts. Node counts were clean last time and a falsehood shipped anyway. Instead:

1. Re-read the compiled artifact and grep it for every superseded assertion by string: `pending O-10`,
   `UNPROCESSED`, `O-9 deferred`, `N=1-clean`, `EEG ≈ boring`, `clinical EEG`. Every hit must be either gone or
   deliberately justified in writing.
2. Re-run the whole-index sweep from `12-STALENESS-SWEEP-2026-07-29.md` and show it returning clean.
3. Confirm additivity separately: 701 ontology nodes, 1,722 canonical terms, 64 tension edges is the current
   baseline. No loss on any axis — *and* no falsehood on any axis. They are different checks; run both.

**A caveat about committing.** `corpus/index/compiled-index.json` was already modified relative to HEAD before any
of this work began. Its diff against HEAD is ~644 lines, of which only ~108 came from the 2026-07-29 repair; the
rest is uncommitted entry-registration work from 2026-07-20 (Social Presence, Presence Theory, Rhetoric of
Interactivity, vle-05). A commit scoped to that file sweeps in far more than the repair. Surface this to the author
rather than deciding it.

**Nothing is committed without the author's explicit sign-off.**

---

## 8. Recommended order

1. **Wave A** (4 sites, 3 files) → recompile → confirm `pending O-10` is gone from `compiled-index.json`.
2. **Wave B** (4 sites, 4 files) → recompile.
3. **Wave C** — read `fcm-05-second-form` and FCM §§24–28, form a view on the §4 layer question, **put it to the
   author with your reasoning**, and only then rewrite the bridge and the digest.
4. **§6** — propose the two draft replacement spans built on the ruling from step 3; on sign-off, apply, re-flatten
   Overleaf, recompile the PDF.
5. **Wave D** — the concordance's 14 markers, resolved against the seven real channels, non-coverage recorded
   explicitly.
6. **G19 gate** — run all three checks above and report the results.

Waves A and B are factual and can run together. Wave C is an argument and must not be batched with them.
