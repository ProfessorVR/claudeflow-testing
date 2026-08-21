# Interactive Coding-Review Plan (v1, 2026-07-20)

> **STATUS 2026-07-23 — REVIEW UNDERWAY. PICK BACK UP AT: Station 3 (families D/E/F + the
> folded-in WE-instrumentation ruling; see §Rulings log at end of file).** Stations 1–2 ruled
> incl. the C2-FLOW residue (ALTER — both applications struck, applied 2026-07-23); the
> alignment audit's approved repairs are DONE; the WE activation-status recount is COMPLETE
> (report `survey-analysis/06-we-activation-recount.md`, integration gated on user sign-off
> at Station 3). Ultracode is OFF for this and future runs (user directive 2026-07-23).

**Goal.** Walk the user through every aspect of the survey-coding process — one station per
exchange, in the same propose→rule→apply loop as the Stage 3 drafting — so the user (a)
understands the reasoning at each step, (b) alters anything that needs altering, and (c) rules
on the two writing deliverables that depend on the review: the M2.2 ¶2 rewrite and the
AI-coder disclosure wording.

**Why this shape.** The coding apparatus is unpublished, dissertation-original methodology
(built 2026-07-06). It is fully re-runnable: raw exports on disk, extraction and merge are
deterministic scripts, all pass files retained. So alterations at any station are
*implementable*, not merely cosmetic — but they have different costs, which each station
states up front:

- **Cost 0 — wording only.** Changes how M2.2 describes the step; no data changes.
- **Cost 1 — recompute.** Re-run a script (merge/stats); downstream counts shift; findings
  F1–F8 must be re-checked where they cite affected counts.
- **Cost 2 — recode.** Codebook or protocol change requiring re-coding of affected
  segments/families (agent-executable; largest token cost; needs explicit sign-off).

**Cadence.** One station per exchange, user may compress or reorder. At each station I
present: the artifact (with live examples pulled from the actual files), my reasoning, the
alternatives I considered or that exist, and the alteration cost. User rules: KEEP / ALTER
(specify) / DEFER.

---

## Station 1 — Corpus preparation & anonymization (cost of changes: mostly 1)
Present: the two derived tables (`respondents.csv`, `open_text.csv`) with sample rows; the
dropped-column list; respondent-code scheme (`<TERM>-Rnnn`, re-derivable, no mapping file);
free-text masking (6 responses); raw exports gitignored. Reasoning: PII-minimal storage;
row-per-answer shape for coding. Rulings available: masking policy, code scheme, whether a
mapping file should exist (currently: no).

## Station 2 — Codebook, part 1: Families A–C (boredom-forms, flight, temporal) (cost 2 if altered)
The analytically load-bearing families. Present each code with its definition, an actual coded
segment from the corpus, and the theory hook (A1's nine friction sub-tags ← the
friction-prediction scorecard; A4-DIV ← the two-channel divergence rule; C1 vs C3 ← felt drag
vs objective length). Key reasoning to examine: codes name *signatures in talk*, never
certified attunements (provenance = projected; category caution). Rulings: definitions,
inclusion/exclusion boundaries, sub-tag roster.

## Station 3 — Codebook, part 2: Families D–F (design nodes, involvement channels,
incorporation) (cost 2 if altered)
D0–D4 keyed to the chain stations (feeds the node scorecard); E = Calleja channel vocabulary
(vocabulary only — no walkthrough claims); F = incorporation-positive signatures
(presence/world/carry-over). Reasoning: the D/A double-coding rule (same friction codes once
for form-diagnosis, once for design). Rulings: node mapping, channel roster, F-family scope.
**[FOLD-IN, approved 2026-07-23: dedicated WE-instrumentation ruling.** Station 3 also
presents the WE activation-status recount (approved and pre-executed per the 2026-07-23
alignment audit): taxonomy ACTIVATOR / NON-ACTIVATOR / OPTATIVE-MANDATE / OPTATIVE-CAPABILITY
(awareness-gap) / COURSE-SOCIAL / HYPOTHETICAL-USECASE / NOT-WE over the 115-row candidate set
(E-SHA ∪ keyword sweep: alone/isolat/discord/watch-with-together/meetup-meeting/multi-user/
collaborat/community/together/classmate/peers/avatar), two blind passes + deterministic
compare + adjudication queue, mirroring the corpus reliability protocol. Rulings at this
station: accept/adjust the recount taxonomy and merge, adjudicate disagreements, and rule how
M3.5 states its numbers (mention-level floors; no denominator exists — the instrument never
asked whether the assigned group convened).**]**

## Station 4 — Codebook, part 3: Families G–H + housekeeping (cost 1–2)
Suggestion taxonomy (G1–G6), emergent family H with promotion rules, X-codes, TRANSLATED flag.
Rulings: taxonomy grain, how emergent promotion should work in any future coding.

## Station 5 — Unit of coding & multi-coding (cost 2 if altered)
The segment (clause/sentence carrying one codable idea); multi-coding across families,
best-fit within family; every application records rcode/item/segment/code/pass. Reasoning:
multi-topic responses; co-occurrence structure needed for the divergence register. Rulings:
unit definition, within-family exclusivity.

## Station 6 — Coder protocol & the AI-coder question (cost 0 for disclosure; 2 for re-coding
under a different protocol)
Present `CODER-INSTRUCTIONS.md` in full: context given to coders, the no-inference rule,
translation handling, batch structure (6 batches). State plainly: both passes were AI passes
(Fable 5), independent and blind. **Deliverable at this station: the user's disclosure
ruling** — options prepared: (a) named in M2.2 prose; (b) substantive footnote at the
reliability sentence; (c) dissertation-level methods statement with M2.2 silent; (d) hybrid.

## Station 7 — Executed design: single-pass + reliability subsample (cost 1–2)
Original two-full-pass design vs the executed lean design (user-directed mid-run): batches
1/2/3/5 pass-1, batch 4 pass-2, batch 6 (143 responses, mostly W26) double-coded. Coverage
numbers (730 + 143 = 873). Reasoning: agreement estimated on a sizable subsample licenses the
single-pass remainder at ~half cost; batch 6 = mostly-unseen-term material. Rulings: is the
subsample adequate; should any further batch be double-coded now (cost 2, quotable before
running).

## Station 8 — Agreement measurement (cost 1 if changed)
Jaccard over code-sets, mean 0.878 on batch 6; per-code agreement table (strongest 100%
G6-USECASE; weakest E-NAR 53%; H-NEW 0% by construction). Reasoning: multi-label coding →
set-overlap measure; kappa-family stats fit single-label designs. Live examples of a
high-agreement and a low-agreement response. Rulings: measure choice, whether to also report
per-family agreement in the dissertation, how to characterize 0.878 honestly.

## Station 9 — Merge rules & auto-adjudication (cost 1 if altered — re-run merge)
The asymmetry, rule by rule with examples: union for mention-level families (D/E/G/F/X);
intersection + keyword-warranted auto-accept for load-bearing A/B/C; A1 sub-tag handling;
A4-DIV at either-pass sensitivity (recall at flag stage, precision at manual review).
Reasoning per rule. Rulings: any rule change → deterministic re-run → downstream count
refresh (F1–F8 re-check).

## Station 10 — Manual adjudication, emergent codes, negative cases, saturation (cost 0–1)
The 4 adjudicated items shown verbatim with the decisions and rationale; H-NEW dispositions
(skeptic/playback/optional); negative-case search results; saturation statement. Rulings:
re-decide any adjudication; emergent-code dispositions.

## Station 11 — Outputs & downstream dependencies (cost 0; orientation)
The coded corpus → counts per term×item×stratum → co-occurrence matrices → friction scorecard
→ DIV register → node scorecard → exemplar bank → findings F1–F8. Map of which findings
depend on which upstream rules, so any Station 2–9 alteration's blast radius is visible
before it's ordered.

## Station 12 — The writing deliverables (cost 0)
With all rulings in hand: (a) rewrite M2.2 ¶2 to the user's chosen depth (working spec from
2026-07-20: instrument derivation, segment unit, codebook-before-coding + family count,
single-pass + double-coded subsample stated plainly, Jaccard with one clause of why, merge
asymmetry in one sentence, adjudication count, disclosure per Station 6); (b) decide whether
the dissertation needs a short coding-methods appendix (gesture-scale per the future-work
rule if deferred).

---

**Standing state going in:** M2.1 revised per user edits (Diec footnote fixed); M2.2 ¶1
approved incl. global-questions revision; M2.2 ¶2 = the coding sentences under review here.
Open items riding alongside: Ulrich year confirmation (recommend vol. 9, 2012); Batch A flags
(exact procedure list; hub structure; device animations); M2.3 blocked (arc decision); M0
post-indexing revision pass queued (svw + ptf + riv + vle-05 material).

---

## Rulings log (updated 2026-07-23)

**Station 1 — RULED KEEP (2026-07-23).** Masking policy, `<TERM>-Rnnn` code scheme, and
no-mapping-file all kept as built.

**Station 2 — RULED KEEP (2026-07-23)** on families A–C definitions, inclusion/exclusion
boundaries, and the A1 sub-tag roster (incl. zero-yield A1.occl and B3 as deliberate
UNATTESTED cells). Adversarially verified 4/4 by the 2026-07-23 alignment audit: A–C
instrument H1 (boredom/flight/justification-demand as the stall's phenomenal registers);
the codebook (2026-07-06) predates the F7 correction (07-13) and the elevated-focus
directive (07-15), so the WE grain asymmetry is historical, not misdesign.
**C2-FLOW residue RULED 2026-07-23: ALTER — both applications STRUCK** (W25-R049/Q5
brevity praise; W25-R076/Q5 self-pacing praise; definition misfits — no time-vanishing
talk). Applied same day (backup `Part_III/.backups/20260723T120832/`): 03-coded-corpus
rows 462/565 → `D2-A3` only (evidence spans retained); t3-stats C2 line removed +
zero-attested note added (A1.occl, B3-PASSTIME, C2-FLOW); 02 adjudication items 5–6 +
limitation 5 extended (C2-FLOW = 0). Blast radius verified before ruling: no finding F1–F8
cites C2; exemplar bank clean; 05-findings untouched (its line-38 temporal-mute limitation
is now stronger as written). C2 stands at 0 as a deliberately retained UNATTESTED cell.

**2026-07-23 alignment audit — approved and EXECUTED repairs (user rulings 1–5):**
1. Station 3 fold-in of the dedicated WE-instrumentation ruling (see Station 3 block above).
2. Cost-0/1 repairs DONE: F7 non-verbatim quote fixed in `survey-analysis/05-findings.md`
   and `reanalysis/deployment-brief.md` (real verbatim = W26-R052/Q9 "required group meetup");
   exemplar bank co-disclosedness section resorted to activation taxonomy (verbatim-verified,
   incl. the previously-truncated W25-R038 "usually alone in the platform" and two non-E-SHA
   non-activator rows); immersion figure reconciled to 70.7% (87/123) in
   `cross-case-synthesis.md` §1 and `deployment-brief.md` §3 (was ≈69%; outline M3.4's ≈69%
   should read 70.7% when drafted); Q10 duplicate (W26-R011=S25-R021, both E-SHA) flagged in
   `02-codebook-final.md` limitation 4.
3. Design consequences recorded in outline M5.2: rung 0 = awareness/onboarding (the
   experiential record's dominant WE-request type is capability-as-if-absent); student-proposed
   activation mechanisms (W25-R060 scheduling sheet; S25-R079 mixer) as M5.2 exemplars.
4. Resolution-raise APPROVED and EXECUTING: WE activation-status recount (two blind passes
   over the 115-row candidate set) BEFORE M3.5/M4.3 drafting. Candidate set:
   `survey-analysis/coding/we-recount-candidates.csv`; passes to
   `we-recount-pass1.txt`/`we-recount-pass2.txt`; report to `06-we-activation-recount.md`.
   Integration into 05-findings/downstream is GATED on user sign-off of the recount report.
5. Ultracode OFF for this and future runs (user directive 2026-07-23; user will re-enable
   explicitly if wanted).

**Station 3 — PARTIALLY RULED (2026-07-23).** (a) Families D/E/F definitions, node mapping,
channel roster, F scope: **KEEP**; plus **ALTER cost 1 APPLIED** — off-codebook `D1-A0A1`
(4 rows) folded into `D0-A0A1`, S25-R069 +`D1-A2` (backup `.backups/20260723T124355/`;
02 adjudication item 7; D0 node now 13, APP 2.4 vs VID 0.5). (b) **Recount SIGNED OFF**
(agreed floors accepted: ACT 1 · NON-ACT 11 · OPT-MAND 3 · OPT-CAP 10; zero disagreement on
experience bins). (d) **M3.5 number-phrasing spec APPROVED** (mention-floors, singular
activator, non-activation = evidenced pole, gap = activation ∧ awareness, M6 carries the
no-denominator ceiling). (c) **Queue rulings IN PROGRESS (2026-07-23).**
RULED: dup pair S25-R021+W26-R011 → HYPOTHETICAL count-once · S25-R043 → OPT-MANDATE ·
W25-R084 → OPT-CAP **with AUTHOR-CONFIRMED 2026-07-23 platform fact: private/reservable
rooms are NOT an existing feature** — the row is a genuine feature request inside OPT-CAP,
so the awareness-gap subset EXCLUDES it at integration · W26-R022 → OPT-CAP.
PENDING CONFIRM (recommendations presented with full-context review): S25-R028 → OPT-CAP
(strengthened: app-user who was in-world and still frames the meet as absent) · W25-R043 →
DEMOTE to HYPOTHETICAL (user insight: "if we could" plausibly conditional on the imagined
new spaces, not counterfactual about capability; context gives no disambiguation) ·
S25-R063 → NOT-WE (embodiment-without-co-presence). **NEW AUTHOR DOCTRINE (2026-07-23,
memory `project-we-avatar-two-forms`):** WE/co-disclosedness can ride on human-controlled
AND computer/program-controlled avatars — either/both can serve rhetorical incorporation;
but avatar-mention alone ≠ WE — first-person embodiment talk with no co-present other is
not a WE signature. F7 addendum + t3 recount table + 06 parenthetical fix execute once the
three pending rows land. NOTE: 06's "OPT-CAP 14 (13 unique after dup discount)" is
internally inconsistent (dup lands in HYPO) — correct at integration.

**Standing cautions carried out of the audit** (for M3.5/M4.3/M0.3 drafting): the sole clean
activator quote (W26-R037) sits on Q10; no activation denominator exists in the instrument;
the locked M0.3 clause "as the data demonstrates" must be re-verified against the recount
results at the queued full-draft thesis re-verify (cost 0 wording either way); Part II
stations the paradigm solicitation at A₁ (Sonny hail) vs the outline's "solicited at A₂/A₃" —
adjudicate before M4.1; the two-channel rule and FCM three-forms vocabulary source from
`construct-crosswalk.md` §4 / the FCM corpus entry, NOT Part II v4 (Part II carries only the
one-paragraph second-form camp reading); F2-WORLD (n=4, all app-users) supports
exemplar-plus-direction claims only.
