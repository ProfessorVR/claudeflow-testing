# Pathe §§1.1–1.9 → DISS-04-EMOTION Subsection Map

**Phase 3.5 — Tier C Cache Reconciliation**
**Run-ID**: 2026-05-13T1439
**Date generated**: 2026-05-13

## Purpose

This file maps the 9 Pathe sub-numbering scheme used in `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md` (the 244-entry Tier C cache) to the current dissertation §1.4 ("Emotion is Motion") subsection structure (DISS-04-EMOTION, subsections S1–S9), so that cache entries can be routed to current claims.

## Top-line map

| Pathe § | Pathe title | DISS-04-S | DISS-04 LaTeX heading | Current §1.4 file line range | Pathe entry count | Cache route status |
|---|---|---|---|---|---|---|
| §1.1 | Emotion: The Form of Desire Under Evaluative Disclosure | DISS-04-S2 | `\subsection{E\textit{motion} is \textit{Motion}: The Affective Architecture of Aristotelian Being-Moved (\textit{Paschein})}` | 5–12 | 27 | route ✓ |
| §1.2 | Pathos and Pathē: Two Articulational Concretions | DISS-04-S3 + S3a/b/c | `\subsection{Pathos and Pathē: Two Articulational Concretions}` and 3 sub-subsections | 13–61 | 23 | route ✓ |
| §1.3 | Enmattered-Accounts | DISS-04-S4 | `\subsection{Enmattered-Accounts}` | 62–65 | 13 | route ✓ |
| §1.4 | The Articulational Concretion: From Doxa to Pathē | DISS-04-S5 | `\subsection{The Articulational Concretion: From Doxa to Pathē}` | 66–77 | 27 | route ✓ |
| §1.5 | Somatic Preparation: Emotion in the Causal Chain | DISS-04-S6 | `\subsection{Somatic Preparation: Emotion in the Causal Chain}` | 78–85 | 18 | route ✓ |
| §1.6 | Variable Presence | (no dedicated §) | **DISSOLVED — content merged into S5 + S6 + S7** | (various) | 16 | route w/ verification flag — see notes |
| §1.7 | The Feedback Loop: Synchronic Chain, Diachronic Saturation | DISS-04-S7 | `\subsection{The Feedback Loop: Synchronic Chain, Diachronic Saturation}` | 86–115 | 37 | route ✓ |
| §1.8 | Emotion's Function in the Chain | DISS-04-S8 | `\subsection{Emotion's Function in the Chain}` | 116–125 | 2 | route ✓ |
| §1.9 | Conclusion | DISS-04-S9 | `\subsection{Conclusion}` | 126–183 | 50 | route ✓ |

**Total entries across the 9 Pathe sections**: 213 unique + ~31 cross-section recurrences (entries reused across sections) = 244 total entries advertised in the master report header.

**Total claims in current DISS-04**: 247 across S1–S9 (per `phase2-claims.json` distribution: S1=3, S2=33, S3=32, S4=15, S5=20, S6=21, S7=43, S8=19, S9=61).

## Sub-subsection map within DISS-04-S3 (Pathe §1.2)

| Pathe §1.2 letter | DISS-04 sub | LaTeX heading | Line range | Notes |
|---|---|---|---|---|
| §1.2.A two-articulations/graded-grades thesis | S3 body | (continuation of S3 main) | 13–24 | P-1, P-11, W-10, Q-FRD-09 |
| §1.2.A (footnote-15-internal) | S3 footnote | (within line 17 footnote) | 17 (fn) | Q-NUS-04, Q-CAS-10, Q-WIT-10, B-9, Q-NUS-06, Q-WIT-03 — note: §1.2.B entries in Pathe map to footnote content within current S3 body |
| §1.2.B "this-as-pursue-able" | S3 body + S3a (footnote) | (line 23 + S3a body) | 23, 25-33 | The pursue-able structure is woven into the chapter's "single-structure" thesis at line 23. |
| §1.2.C animal-case analogical | S3 footnote (line 17 nested) | (within line 17 footnote) | 17 (fn) | P-7, P-6, Q-HAW-12, Q-GON-08, B-6 are the §1.2.C entries (animal-case) — all map to the inline-footnote-17 of current S3. |
| §1.2.D Metaballontes/Kriseis/pleasure-pain | S3c | `\subsubsection{The Rhetoric's Constitutive Threefold: Pathos as Change, Krisis, and Hedonic Tonality}` | 50–58 | Q-HRH-09, Q-DOW-06, Q-DOW-05, etc. |

## Sub-subsection map within DISS-04-S3a/b/c

DISS-04-S3 (`Pathos and Pathē: Two Articulational Concretions`) contains three explicit `\subsubsection{...}` blocks:

| Sub-sub | LaTeX heading (line) | Line range | Maps from which Pathe entries |
|---|---|---|---|
| S3a | `\subsubsection{From the Lectures to Being and Time}` (line 25) | 25–33 | Cross-Heideggerian bridging — receives Q-AGO-07 entries that also appear in §1.9 E. The (CITE) placeholder at line 33 ("CITE" after "discourse" in Being and Time) is a separate (CITE) NOT yet addressed in master report; see new gap DISS-04-G29. |
| S3b | `\subsubsection{The Metaphysics Fourfold: Pathos from Alterability to Magnitude}` (line 35) | 35–48 | Receives BCAP 131-132 grounding (some cache entries route here for Heidegger's fourfold reading: Q-AGO-06, Q-COS-03 contextually). |
| S3c | `\subsubsection{The Rhetoric's Constitutive Threefold: Pathos as Change, Krisis, and Hedonic Tonality}` (line 50) | 50–58 | Receives Pathe §1.2.D entries (Q-HRH-09, Q-DOW-06, Q-DOW-05, Q-CHR-08, Q-AGO-01, Q-COS-01, Q-WIT-02, Q-HRH-16, Q-HRH-07, Q-COS-07, Q-GON-07). |

## Critical Pathe §1.6 dissolution analysis

**The user's note at 2026-05-13** flagged that Pathe §1.6 (Variable Presence) may have shifted location. Verification via anchor-matching of Pathe §1.6 entries against current §1.4 text yields:

| Pathe §1.6 entry | Pathe §1.6 letter | Insertion anchor present in current §1.4? | Routed to DISS-04-S? |
|---|---|---|---|
| Q-NUS-07 ★★★★ (Nussbaum 1985, p. 261) | A (CITE placeholder) | **NO** — the sentence "As Nussbaum notes in her commentary, phantasia is indispensable because it supplies the material for practical reasoning and action (CITE)" **does not appear verbatim** in the current §1.4 file. The placeholder appears to have been **edited out** during chapter revision. **FLAG FOR USER VERIFICATION.** | possible route to S6 (Somatic Preparation, after line 84) OR new section to be added |
| Q-FRD-03 ★★★★ (Frede 1992, p. 287) | A (paired with Q-NUS-07) | Same as Q-NUS-07 — original (CITE) site missing | possible route alongside Q-NUS-07 |
| Q-CAS-03 ★★★ (Caston 1995, p. 41) | B | Anchor "Sense-perception (or thinking) delivers the *resonant aisthema*" — **NOT FOUND** verbatim; fuzzy match to S6 line 80 ("sense-perception or thinking → imagination → desire → affections...") | possible route to S6 line 80 |
| Q-GON-05 ★★★ (Gonzalez 2006, p. 120) | B | Anchor not specified explicitly; "phantasia — the soul's [re]presentational device — mediates between sense perception and the critical faculties" routes to S6 line 80 fuzzy | possible route to S6 line 80 |
| Q-NUS-05 (recurrence of §1.5) | B | Already routed to S6 in §1.5 cluster | route to S6 ✓ |
| P-4, Q-HAW-04, Q-CST-03 ★★ | B | No explicit anchors; supplementary | route to S6 ✓ |
| Q-OGR-10 ★★★ | C | Anchor "The *doxa* transforms the *phantasma's* latent affective valence … into a determinate emotional state" — **NOT FOUND** verbatim; fuzzy to S5 line 74 ("Without this dispositional uptake — this believing/opining-it-to-be-the-case-for-me — fear cannot arise") | possible route to S5 line 74 |
| Q-HAW-02 ★★ | C | No explicit anchor; supplementary | route to S5 ✓ |
| W-5 ★★★★ (White 1985, p. 493) | D | Anchor "Emotion responds to *how things appear*" — **NOT FOUND** verbatim but fuzzy match to S6 line 84 ("the doxastic component of emotion is closer to perceptual recognition than to discursive inference") OR S9 line 176 ("emotion responds to appearance, not to corrected judgment") | **route to S9 line 176** (strong match for "responds to appearance") |
| Q-WIT-09 ★★★ | D | Anchor "It operates, as Heidegger would later say, at the level of *Stimmung* or *mood*" — **NOT FOUND** verbatim; fuzzy match to S7 lines 102-104 (Stimmung-saturation) | possible route to S7 lines 102-104 |
| Q-HRH-14 ★★★, Q-RIC-12 ★★★ | D | No explicit anchors; supplementary | route to S7 ✓ |
| Q-CAS-12, Q-OGR-12, Q-CHR-01-recur ★★ | D | Supplementary | route to S7 / S6 as appropriate ✓ |

**Conclusion**: Pathe §1.6 has been DISSOLVED in the current chapter — its content has been distributed across:
- DISS-04-S5 (lines 66-77) — the doxa-mediated emotion material (§1.6 C)
- DISS-04-S6 (lines 78-85) — the actualization-chain opening (§1.6 B)
- DISS-04-S7 (lines 86-115) — the Stimmung-saturation material (§1.6 D)
- DISS-04-S9 (lines 126-183) — the "emotion responds to appearance" thesis (§1.6 D / W-5)

**The (CITE) placeholder originally targeted by Q-NUS-07 has been edited out**; this is flagged for user verification. Q-NUS-07 remains a ★★★★ candidate for re-insertion at any expanded "Variable Presence" content the user may wish to restore, OR can route to S6 at the somatic-preparation chain.

## Pathe §1.7 (Feedback Loop) → DISS-04-S7 confirmation

The Pathe §1.7 (CITE) placeholder for "the susceptibility of the dream, the ill, and the passionately agitated to *phantasmatic* deception (CITE)" — resolved by **W-9 (White 1985, p. 504 n. 88)** — anchors to current §1.4 line 98:

> "the susceptibility of the dreamer, the ill, and the passionately agitated to *phantasmatic* deception (*On Dreams* 460b3-16; 461b3-8)"

Note: the user's current text already supplies an Aristotelian primary citation `(On Dreams 460b3-16; 461b3-8)` at this position — therefore W-9 (which provides the same anchor as a secondary scholarly reference) becomes a **supplementary footnote** rather than a primary (CITE)-resolver. The (CITE) appears to have been resolved with primary text rather than the secondary planned. W-9 remains valuable as scholarly confirmation.

## Cross-section recurrences

The master report deliberately duplicates several entries across §-numbering. These are deliberate cross-section uses:

| Cache ID | Primary § | Also at § | Note |
|---|---|---|---|
| Q-HRH-08 | §1.1 D | §1.3 A | Links forward to enmattered-accounts |
| Q-WIT-01 | §1.1 B (epigraph candidate) | §1.9 E (epigraph) | Compelling phenomenological framing |
| Q-NUS-05 | §1.5 A | §1.6 B | Forms of pleasant/painful |
| Q-CHR-01 | §1.4 A | §1.6 D | Anger/how-things-appear |
| Q-FRDL-09 | §1.5 A | §1.7 A | Deft amplification |
| Q-DOW-10 | §1.8 A | §1.9 E | Two-key-features of passions |
| Q-FRD-04 | §1.9 B | §1.9 E | Future-good as phantasma |
| Q-HRH-12 | §1.7 B | §1.9 E | Speech-roots-in-mood |

These ~8 cross-section uses are tracked once in the parsed JSON entries list with a suffix `-recur` or `-§1.x`.

## Recommended routing summary

Of the 244 cache entries advertised in the master report:
- ~227 entries route to current DISS-04 subsections with clear anchor matches (exact or strong fuzzy)
- ~17 entries (mostly §1.6 cluster) need user verification because their anchor sentences are no longer present in the current §1.4 text after chapter revision

The high recurrence count (~31) means the **unique-cache-entry** count is ~213; the master report's "244" includes deliberately-duplicated cross-section uses.
