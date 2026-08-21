# DECISIONS REGISTER — Laboratory Boredom section (v8, 2026-08-05)

Supersedes `DECISIONS-REGISTER-v7-2026-08-05.md`. Complete and standalone.
Version chain: supersede with `-v9-`, never edit in place.

**v8 banks: O-03 resolved by author ruling; the D-11 eye closure rename EXECUTED; D-12 REVISED to the
per-participant gaze baseline; X-07 and X-06 EXECUTED into a v5 analysis tree; a correction to the reported
direction convention; and eight findings from Step A's reading and verification. Open decisions: 3, none
blocking.**

---

## 0. STYLE AND SOURCE LOCKS

| # | Lock |
|---|---|
| **S-01** | **American spelling throughout — "center," never "centre."** Executed in the v5 tree: 81 occurrences in generated output reduced to 2, both in a dated recon manifest that is not dissertation-bound and was left unedited as a prior artifact. `ANALYSE_IMU` retained as a code identifier that `report.py` quotes as a literal. |
| **S-02** | **`archon-cli-v3` is the sole source for corpus, index and retrieval.** Binary `target/release/archon` (v1.3.11, `a365f3f2`); store `.archon/` (6.5 GB); corpus `corpus/`; **index `index/` — PROJECT ROOT.** Re-verified 2026-08-05: 241 documents, 13,564 chunks, 18,238 pages, 0 failed, index queue empty. **`archon-cli-v3/corpus/index` does not exist**, so there is no wrong tree inside v3; the tree to avoid is `claudeflow-testing/corpus/index`, which does exist. The two diverge — v3 carries a `Dissertation` entry (29) the other lacks (28). |
| **S-03** | **Verification gates on EXACT MATCH** — never "found," never fuzzy. FCM page loci **read from the running head, never computed**. |
| **S-04** | **NEW — two archon behaviors produce FALSE verification failures, and both must be ruled out before a quotation is called wrong.** (a) **Hyphens break the FTS query parser**: `verify-quote` returns `FTS search failed … exact scan fallback is capped at 2000 chunks`; passing `--doc <id>` routes around it. (b) **Unrestricted search can miss a quotation that is present**: one span returned no hit unrestricted and exact with `--doc`. Procedure: unrestricted → retry per-document → only then a real mismatch. |

## 1. RULED — analysis scope and channel status

| # | Ruling |
|---|---|
| R-01 | **Cognitive load is NOT load-bearing.** Vendor-computed. Appendix only. Evidenced: rho −0.09 / +0.11, perm p 0.65 / 0.60. |
| R-02 | **Heart rate and HRV removed entirely.** Evidenced: rho +0.09 / +0.04, p 0.68 / 0.86. |
| R-03 / R-04 | **IMU head motion and video-derived head pose — DEFERRED.** |
| R-05 | **Load-bearing channels:** pupil, eye closure, gaze, the 7-item self-report. EEG a full negative. |
| R-06 | **Equal focus on all three films.** |
| R-07 | **Survey administered per episode.** |
| R-08 | **Boring stimulus** = a 17-minute section of a 1989 Microsoft Word tutorial. |
| R-09 | **S04's `minutes until bored` on the boring film is VOID.** |
| R-10 | **R2-03 analyzed as a single session.** |
| R-11 | **Overlay videos** in scope as corroborating material only. |

## 2. RULED — data, method, and argument

D-01 through D-10 carry forward from v7 unchanged. D-13 through D-35 carry forward except where amended below.

| # | Ruling |
|---|---|
| **D-11** | **EXECUTED 2026-08-05 — the closure surface is named EYE CLOSURE, in full.** The author approved the full rename, not a relabel. `closure_frac = 1 − openness_frac` is computed on both rounds and enters composite A at **sign −1**. **The composite is provably unchanged**: within-subject z of (1 − x) is exactly −z(x), so closure-at-(−1) reproduces openness-at-(+1) identically. This is asserted on every run by `crossref.assert_rename_is_value_preserving()`, which aborts if it ever ceases to hold; the measured maximum deviation is **2.1e-15** against a 1e-12 threshold, and `keystone-decomposition.csv` is **byte-identical to v4**. **What does move is the sign of every quoted number for that channel:** criterion vs boredom **+0.460** (was −0.460), vs engagement **−0.416** (was +0.416); separation rb **+0.974** / **+1.000** (was −0.974 / −1.000), direction 11/12 and 12/12. **Probabilities are unchanged to the last digit**, because the permutation null is compared on absolute value and Wilcoxon ranks the magnitude of paired differences. **The reproduction gate is deliberately untouched** and still tests the canonical openness quantities against their locked values — rewriting it in the new direction would have replaced the continuity proof with a restatement of the rename. Its labels were corrected from "eye-closure" to "eye openness (canonical)", which was always what it tested. |
| **D-12** | **REVISED 2026-08-05 — the criterion measure is the PER-PARTICIPANT gaze baseline.** No baseline is primary; each is assigned to the question its construction lets it answer. **Separation → device-forward** (unchanged; it also carries the study's only correction-surviving gaze result). **Agreement with self-report → per-participant median**, with the **per-file** measure reported alongside it. **The ground is the design, not the coefficient.** The agreement analysis is entirely within-subject, and the per-participant baseline is the only one of the three built the same way: it removes what differs between people and does not bear on the question — how the headset sat on that face — in the vector domain where that nuisance lives, while preserving what differs within a person between films. The per-file baseline recenters inside each episode and erases that between-film difference before any test can see it. That the per-participant baseline also scores highest (**+0.590 / −0.585** against **+0.524 / −0.527**) is corroboration. **Supersedes v7's D-12**, which assigned the per-file measure on the then-available evidence. Prose: `PROSE-METHODS-GAZE-BASELINE-v2-2026-08-05.md`. |
| **D-36** | **NEW — the reported `direction` count is the count that AGREES with the effect.** It previously reported "first film lower" unconditionally, which corroborated the effect only where the effect ran downward. That was already wrong for sleep-fight (rb +1.000 printed as "0/12" while the finding is a twelve-of-twelve) and the D-11 rename would have turned the headline "11 of 12" into "1/12". Both raw counts are retained in their own columns. **Consequence:** surfaces where rb > 0 now print the complement of what v4 printed — chiefly the EEG negatives and the self-report items; no load-bearing downward effect moves. This aligns the artifact with the convention the outline already used. |
| **D-37** | **NEW — sleep-fight is 10 of 12, not 12 of 12.** Outline v5 §L3.2 states "sleep-fight sharpest (**12 of 12**, Holm 0.0059)". The data is **10 higher, 0 lower, 2 tied** — S04 at 1/1 and S06 at 6/6. The defensible form: *no participant fought sleep less on the boring film than on the interesting one, and ten of twelve fought it more.* S04's tie is consistent with her inversion profile and corroborates L3.9 rather than weakening it. rb = +1.000 is correct, since rank-biserial excludes ties. |
| **D-38** | **NEW — O-03 RESOLVED (author ruling 2026-08-05): the co-author/participant overlap is NOT stated in the dissertation section.** It is not necessary for this section's argument. No disclosure sentence, no re-identification exposure, and **no hypothesis-awareness alternative account is added to L4.2 or L6** — R2-03's profile is explained from their own answers as v7 had it. The two ASEE works-cited entries remain a separate bookkeeping matter at assembly. |

## 3. ESTABLISHED — findings about the instrument

F-01 through F-15 carry forward from v7 unchanged.

## 4. FINDINGS from the analysis runs

N-01 through N-17 carry forward from v7, **with the sign of every eye closure figure inverted per D-11** — N-01 reads eye closure **+0.460** (0.0212) and **−0.416** (0.0370).

| # | Finding |
|---|---|
| **N-18** | **NEW (X-06a) — the per-participant gaze baseline is the strongest criterion channel in the study**: rho **+0.590** vs boredom (perm p 0.0024) and **−0.585** vs engagement (0.0022), against the per-file baseline's +0.524 / −0.527 and the device-forward baseline's non-surviving +0.359 / −0.391. It is **uneven on separation** — best of the three on boring against interesting (8/8 in Round 1) and **chance on boring against clinical (4/8)** — which is why the separation assignment is untouched. |
| **N-19** | **NEW (X-06b) — every load-bearing criterion association points the same way in both rounds**, so none is carried by one round. Gaze is markedly stronger in Round 2 (**+0.812 / −0.914**) than Round 1 (+0.417 / −0.355); on the per-participant baseline, +0.868 / −0.928 against +0.475 / −0.429. **This is independent support for the rate account (N-16)**, which previously rested only on the separation test. Round 2 is thin by construction — 6⁴ = 1,296 arrangements — and is descriptive. |
| **N-20** | **NEW — a latent sign bug in `sensitivity.py`, found by the sweep's own baseline-reproduction guard.** The module built its channel list dropping the sign, which was harmless while every channel ran +1 and silently inverted every swept composite once one did not. It aborted the run with an 8-of-12 category mismatch against `crossref.keystone()`. Fixed by carrying a sign map. **The guard worked exactly as designed** and is the reason the rename did not corrupt the sensitivity space. |

## 5. FINDINGS from Step A — the literature reading

| # | Finding |
|---|---|
| **A-01** | **The index entries put paraphrases inside quotation marks.** Two of the first ten candidates were not verbatim. `bor-sec-04` gives "to investigate profound boredom's place…" where the chapter reads "with the aim of **investigating its place**…"; `bor-sec-13` gives "each attunement is understanding…" where Slaby wrote each attunement **"is understanding"** and each understanding has its attunement — the entry dropped his own internal quotation marks. **Nothing from an entry enters prose without passing the gate in its own right.** |
| **A-02** | **`bor-sec-19` (Thomson) IS NOT A BOREDOM SOURCE.** A full-text check for "bored," "boredom" and "Langeweile" returns **zero hits**. Outline v5 §L1 ¶4 places Thomson in the boredom-and-education paragraph; citing him there as a boredom source would itself be the misattribution the entry warns of. His contribution is the paideia / enframing / "letting learn" frame, and his one genuine construct link is monotony-meaninglessness. **Folded into outline v6.** |
| **A-03** | **`bor-sec-38` (Scharinger) is 2015, not 2019, and is likewise NOT a boredom source.** The entry carries an explicit bibliographic correction; the on-disk directory name carries the wrong year. Its value is as a dual-measure methodological anchor. |
| **A-04** | **★ Scharinger is a published precedent for this section's oppositional ranking.** Pupil dilation and EEG alpha both registered the load effect independently and **did not correlate with each other** (r = −.16 and −.14, ns), and alpha alone tracked reading comprehension. Two channels can register the same manipulation and disagree with each other — which is this section's L3.6 finding, with a prior in the literature. |
| **A-05** | **`bor-sec-11` — the manifest's author-attribution flag is RESOLVED.** Three authors, not one: **Juan Diego Hernández Albarracín, Carlos Fernando Álvarez González, Marc Pallarès Piquer**, *Tópicos, Revista de Filosofía* 62 (2022), pp. 193–222. The on-disk filename "Hernandez-Alvarez-Pallares" is the three surnames concatenated, not a mismatch. **The works cited needs all three names and the year 2022.** |
| **A-06** | **`bor-sec-28` (Kim) — the null is confirmed as the outline states it.** No statistically significant correlation between questionnaire scores and any extracted physiological feature, at thirteen analyzed participants. |
| **A-07** | **`bor-sec-27` (Barry) — eyes-closed and eyes-open are non-equivalent baselines**, alpha indexing global arousal while focal delta/theta/beta index activation. Bears on this section twice: on the EEG negative, and on eye closure as a surface. |
| **A-08** | **`bor-sec-33` (Yuvaraj) — the "no resting baseline" gap is confirmed.** Both conditions are active, eyes-open video-viewing differing only in induced affect; there is no resting-state baseline of any kind. |
| **A-09** | **`bor-sec-18` (Mansikka) — the pedagogical precedent for the keystone's structure.** His second form maps onto engaged-but-inauthentic learning, in which a student is fully occupied and even high-achieving while governed by *das Man* — the form that **behavioral-engagement metrics would systematically fail to detect, because engagement and hollow boredom are compatible rather than opposed.** That is L4.2's structure, argued in a classroom register a decade earlier. |
| **A-10** | **`bor-sec-29` (Miyauchi) carries no multi-word source quotations at all** — a summary entry. Consistent with its "compactly" cited role in L1 ¶7; no worked quotation is available from it. |

## 6. OPEN — awaiting the author (3, none blocking)

| # | Question | Where |
|---|---|---|
| O-06 | How much of the published studies to re-present vs cite | L1 ¶8 — constrained by the 4–5 pp cap |
| O-14 | Multiplicity in the criterion family — recommendation is a footnote | L2.8 (`******`) — at drafting |
| O-15 | IRB-facing survey wording | L2.2, L2.8 (`******`) — at drafting |

**Resolved since v7:** O-03 (D-38) · D-11 executed · D-12 revised · X-07 and X-06 executed · D-36, D-37 added.

**Standing, not a question:** **N-06 — draft with Fable at xhigh. The author switches the model personally and is
to be NOTIFIED when Stage 3 begins.**

## 7. STANDING

PII: `S01`–`S08` / `R2-01`–`R2-04` only; crosswalk never persisted. Round 1 source filenames carry participant
names, so paths are never reproduced in output.
Verification-gated: quotes EXACT before prose; index entry → `docs search` → `verify-quote` (EXACT only, with
S-04's two false-failure modes ruled out) → PDF last, all from `archon-cli-v3`; backups before touching approved
files; **nothing committed without explicit sign-off — and nothing has been committed across any session of this
work.**
Doctrine: chain-node walkthrough is the analytical form · NO-STALL · GREATEST-DESIRE · "demonstrated" never
"prove" · potentiality is always actualized within a narrowed field (D-29).
Statistics: directional convergence plus the surfaces that reach significance; never per-channel significance for
channels that do not; n < 6 labeled descriptive; at n = 4 the signed-rank floor is p = 0.125; **every criterion
probability is a within-subject permutation p.**
Category caution: episodic structural grammar only, never a *Grundstimmung* claim — a requirement of the frame
per D-33, not modesty. No learning-outcome claims.

## 8. ANALYSIS TREE

**`boredom-analysis-v5-2026-08-05/` is CURRENT.** v4 is retained untouched as the audit artifact and is
byte-identical to its delivered state. 27 tables, 72 figures, gate 8/8 PASS on both the canonical path and this
tree's own extractors. Every v4 table is numerically identical in v5 once label spelling and the closure rename
are normalized; **no number in this section moved during X-07.**
