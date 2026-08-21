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
no-denominator ceiling). (c) **Queue FULLY RULED (2026-07-23):** dup pair → HYPOTHETICAL
count-once · S25-R028 → OPT-CAP · S25-R043 → OPT-MANDATE · S25-R063 → NOT-WE · W25-R043 →
HYPOTHETICAL (demoted after author insight: "if we could" plausibly conditional on the
imagined new spaces) · W25-R084 → OPT-CAP as genuine feature request (AUTHOR-CONFIRMED: no
reservable private rooms exist; excluded from awareness-gap subset) · W26-R022 → OPT-CAP.
**FINAL FLOORS: ACT 1 · NON-ACT 11 · OPT-MANDATE 4 · OPT-CAP 13 (awareness-gap 12) ·
COURSE-SOCIAL 28 · HYPO 49 counted (50 rows, dup once) · NOT-WE 8.** **INTEGRATION EXECUTED
2026-07-23** (backup `.backups/20260723T132352/`): F7 recount addendum appended in
05-findings (2026-07-13 correction block intact); recount table appended to t3-stats; 06
status/rulings/final-floors updated incl. fixing the inconsistent "(13 unique)"
parenthetical; M3.5 spec locked. Disclosure (06 item 4) rides Station 6. **NEW AUTHOR
DOCTRINE** (memory `project-we-avatar-two-forms`): WE/co-disclosedness can ride on human-
OR computer/program-controlled avatars; avatar-mention alone ≠ WE —
embodiment-without-co-presence excluded (S25-R063 precedent). **STATION 3 COMPLETE.**
FLAGGED for cost-0 ruling: 05-findings F7 bullet 1 still reads "~69%" for Q8 immersion-Yes;
the 2026-07-23 audit reconciled this figure to 70.7% (87/123) in cross-case-synthesis and
deployment-brief, but 05 was not on the audit's repair list — AWAITING user ruling to
harmonize. ALSO surfaced for Station 4: G6-USECASE's "sub-note the domain" contract was NOT
executed (14/181 rows carry notes, all quote spans not domain tags).

**Station 4 — RULED (2026-07-23).** (a) G taxonomy grain KEEP; the G6 domain-sub-note
shortfall (14/181 noted, quote spans only) ruled cost-0 — documented as 02 limitation 6;
enrichment pass available on demand. (b) Emergent-promotion standing protocol ADOPTED for
future coding (recorded in 02 §Emergent): emergent codes admissible any pass; distribution
claims for mid-run-invented codes require a batch/term-neutral keyword sweep (report sweep
numbers, not raw counts); promotion only at a documented revision point. (c) X-codes +
TRANSLATED KEEP. Also EXECUTED per user ruling: cost-0 harmonization of 05-findings F7's
Q8 immersion figure ≈69% → 70.7% (87/123), dated inline (backup `.backups/20260723T153017/`).

**Station 5 — RULED KEEP (2026-07-23).** (a) Response-level operationalization of the
segment ideal KEEP (02 limitation 2 stands as the documented deviation; code-set sizes
508×1 / 260×2 / 77×3 / 28×≥4, max 6; conservative once-per-response counting). (b)
Within-family best-fit-per-segment + the A4-DIV respondent-level exception KEEP. Cost-0
rider to Station 12: M2.2 ¶2 describes the unit honestly — segment-guided reading,
response-level code sets, evidence spans for A/F1/C1; no implication of stored
segment-level records.

**Station 6 — RULED (2026-07-23): disclosure option (d) HYBRID.** One plain clause in M2.2
¶2 prose naming the AI coding + a substantive footnote at the reliability sentence carrying:
models per batch (Fable 5 = both batch-6 reliability passes, batch-3 pass-1, batch-4 pass-2,
both recount passes; Haiku 4.5 = single-pass batches 1/2/5), model heterogeneity +
spot-check statement, blind two-pass design, deterministic merge, 7 manual adjudications,
the author's station-by-station apparatus review, and the recount passes (same footnote,
per 06 item 4); optional pointer to a dissertation-level AI-use statement if one is created.
Wording drafts at Station 12. User follow-up ("why Haiku on 1/2/5?") answered from the
record: the user's own mid-run token-discipline directive 2026-07-06 (Haiku for mechanical
coding, ~2× cheaper/~10× faster, after codebook freeze + .878 measured); honest limit = no
cross-model agreement stat exists (Fable–Fable only; Haiku spot-checked, never double-coded)
— feeds Station 7's further-double-coding question.

**Station 7 — RULED (2026-07-23): FULL FABLE RE-PASS of the Haiku batches ORDERED.** User
directive: ALL coding passes are Fable 5 — even across usage-renewal waits; supersedes the
2026-07-06 Haiku-for-mechanical-coding directive for coding passes. Execution: SEQUENTIAL
with a user-confirmation gate after every batch (batch 1 → confirm → batch 2 → confirm →
batch 5). New passes = `coding/pass2-{1,2,5}.txt`, blind under CODER-INSTRUCTIONS protocol
(coder sees ONLY the instructions + batch input; no coded artifacts). On completion the
Haiku passes `pass1-{1,2,5}` are SUPERSEDED as canonical (retained for cross-model
comparison; per-batch compare reports = `coding/xmodel-batch<N>-compare.txt`).
Corpus/t3/findings refresh = ONE deterministic pass after the batch-5 confirmation, with
adjudications 1–7 SUPREME (C2 strike + D1-A0A1 fold-in survive regardless of new-pass
output; batch 2 holds W25-R049/R076, batch 5 holds the D1-A0A1 rows). Batch composition:
b1 = 146 W25 · b2 = 146 W25 · b5 = 77 S25 + 69 W26.
**Batch 1 EXECUTED 2026-07-23:** pass2-1.txt verified (146/146 aligned, vocabulary clean);
Haiku↔Fable mean Jaccard **0.596** (56/146 exact; 50 rows < 0.5) vs the .878 Fable–Fable
benchmark — the re-pass directive is empirically vindicated. Systematic divergences and the
full low-agreement table: `coding/xmodel-batch1-compare.txt` (D2-A3 inflation on off-topic
praise, X-EMPTY under-reads, E-SHA under-application, extra F1-PRESENCE/A4-DIV; Fable
H-NEW-vr-redundant ×6 = the F6 skepticism theme rediscovered in W25). **Batch 2 EXECUTED 2026-07-23** (user-confirmed): pass2-2.txt verified (146/146, vocabulary
clean); Haiku↔Fable mean Jaccard **0.514** (41/146 exact; 67 rows < 0.5). Headlines: the
**C2 strike was independently replicated blind** (R049/Q5 → D2-A3;C3-LENGTH; R076/Q5 →
D2-A3; zero C2-FLOW batch-wide); **F3-CARRY collapse** — 14 Haiku applications, 0 sustained
by Fable (corpus F3 = 18 with 16 W25; incorporation-positive claims citing F3 re-check at
refresh); H-NEW-videos-suffice ×5 = third independent discovery of the F6 skepticism theme.
Report: `coding/xmodel-batch2-compare.txt`.
**Batch 5 EXECUTED 2026-07-23** (user-confirmed): pass2-5.txt verified (146/146, vocabulary
clean); Haiku↔Fable mean Jaccard **0.668** (77/146 exact; 37 rows < 0.5; per-term uniform
S25 .669 / W26 .666). Headlines: **adjudication 7 blind-replicated** (D0-A0A1 on three
fold-in rows; exact D1-A2 on S25-R069); adjudications 1–4 confirmed batch-6-only (safe);
new Fable A4-DIV flags W26-R011/Q5 + W26-R014/Q6 → DIV-register review candidates; MASK
anonymization flag on W26-R007/Q5 (Station 1 follow-up); X-EMPTY under-reading ×8 and
G5→G3 boundary shifts. Report: `coding/xmodel-batch5-compare.txt`. **ALL THREE REPLACEMENT
PASSES COMPLETE (.596 / .514 / .668). REFRESH EXECUTED 2026-07-23** (user-confirmed; backup
`.backups/20260723T173251/`): 03 rebuilt (438/438 rows, adjudications 1–7 verified intact),
t3 fully recomputed (semantics validated against pre-refresh corpus), 02 updated (all-Fable
canonical; limitation 3 CLOSED with measured Jaccards; H-NEW dispositions extended;
limitation 7 = MASK flag). **Findings impact: `survey-analysis/07-repass-impact-memo.md`**
— headline deltas: F3-CARRY 18→7, F1-PRESENCE 25→19 (F7 rates 4.3/1.2 → 2.8/1.5), A4-DIV
18→13 (register recomposed, 7 removed / 2 added), E-SHA 67→91, A1.dark 4→10 (F2 upgrade),
X-OFFTOPIC +23, X-EMPTY −17. **IMPACT-MEMO RULINGS RECEIVED + APPLIED 2026-07-23** (backup `.backups/20260723T180045/`):
05-findings harmonized (F1 rates + foreclosure trio; F2 incl. dark 4→10 → **ATTESTED**;
F3 zero→one F-code w/ W25-R044/Q10 named; F4 counts; F5 "13 candidates — 12 unique" +
§D re-sort with residue CONFIRMED unchanged [W26-R016 + S25-R009]; F7 presence 2.8-vs-1.5
+ E-SHA 91). 04 exemplars fixed ×3 (carry-over exemplar → W26-R018/Q5 verbatim). W26-R007/Q5
masked in open_text.csv + batch-5.txt = the corpus's 7th masked response (00-data-audit +
02 limitation 7 updated). Not ordered/not applied: F7 magnitude hedge; F6 optional
replication sentence. **RESUME = Station 8** (agreement measurement — .878 per-code table +
recount 93.0% + cross-model .596/.514/.668; stale MISSING-FILE warnings in
agreement-stats.txt now cosmetically wrong since pass2-{1,2,5} exist with a new role).

**Station 8 — RULED (2026-07-23).** (a) Jaccard KEPT as primary + **α-MASI companion
COMPUTED: 0.820** (raw-slug convention matching the .878; 0.825 H-normalized; n=143,
Do=.1635, De=.9097) — clears Krippendorff's .800 reliability convention. (b) Per-code
agreement clause APPROVED for the Station 12 footnote (range 50–100%; weakest on
union-merged mention codes E-NAR 53/E-AFF 60, strongest on load-bearing families —
design-coherence point). (c) Characterization formula APPROVED: .878 mean Jaccard on a
16.4% double-coded subsample of the least-familiar term + α-MASI .820 + recount 93.0%
exact + cross-model .596/.514/.668 as the measured heterogeneity that motivated the
all-Fable re-pass. (d) Housekeeping EXECUTED: agreement-stats.txt ANNOTATED (not
regenerated — regeneration would merge superseded Haiku passes with the replacements);
annotation includes a **do-not-re-run warning on scripts/merge-adjudicate.py**, whose
loader globs all batches and would overwrite the replaced corpus.

**Station 9 — RULED KEEP ×4 (2026-07-23):** union for D/E/G/F/X/H · intersection +
keyword-warrant for A/B/C · A1 sub-tag keep-warranted/drop-other · A4-DIV either-pass
sensitivity. Empirical support noted: the re-pass showed omission was the dominant coder
error (vindicating union's trust-the-mention bet) and the queue caught exactly the four
judgment items. **Keyword-warrant lists printed for user review** — key finding: the
auto-accept path NEVER FIRED in the executed batch-6 merge (all 4 one-sided A/B/C
instances = the 4 manual adjudications; the regex component was inert in execution).
Loose patterns flagged prospectively (lag:"load", nav:"find" [collides with
needs-finding course vocabulary], dark:"see"); A2-DIFFUSE deliberately has an empty
pattern (always queued). Lists RULED 2026-07-23: KEPT unchanged as historical
record + prospective tightening note ADDED to 02 §standing protocol (future merges must
tighten lag:"load" / nav:"find" / dark:"see" before the auto-accept path fires; A2's empty
always-queue pattern deliberate). **STATION 9 COMPLETE.**

**Station 10 — RULED (2026-07-23):** adjudications 1–4 RE-AFFIRMED (all verified intact in
the rebuilt corpus; 5–7 additionally blind-replicated) · emergent dispositions KEEP (8
slugs; skepticism theme = 4 independent blind discoveries) · saturation statement RESTATED
per approved wording in 02 (X-counts refreshed; semantic-saturation claim now STRONGER:
scheme survived a 438-row cross-model recoding without needing a new category).

**Station 11 — ORIENTATION DONE + residual sweep EXECUTED (2026-07-23):** dependency map
empirically exercised by the refresh; residual stale mirrors found and harmonized (backup
`.backups/20260723T185233/`): 05 F6 per-term frictions; deployment-brief (friction counts,
D2/D3, B1 48, F1-PRESENCE rates, crash arc); cross-case-synthesis §(iii). Immune layers
confirmed: survey-derived splits, keyword sweeps, WE recount, adjudication layer. Open
at-drafting items: outline M3.4 70.7%; M0.3 thesis-clause re-verify. **RESUME = Station 12
(the writing deliverables: M2.2 ¶2 rewrite + disclosure wording + appendix decision).**

**Station 12 — RULED (2026-07-23): BOTH DELIVERABLES APPROVED AND WRITTEN. REVIEW COMPLETE
(all 12 stations).** (a) M2.2 ¶2 rewrite APPROVED without per-¶ workthrough — WRITTEN into
`drafts/DESKTOP-M2-DRAFT-v1.tex` (replaces the old coding sentence; transparency flag
comment resolved; backup `.backups/20260723T190217/`). (b) Disclosure footnote APPROVED —
in the draft at the adjudication sentence (option (d) hybrid: plain prose clause + the
substantive footnote incl. the measured-and-replaced Haiku story). (c) **Minimal
coding-methods appendix APPROVED** — draft v1 written:
`drafts/DESKTOP-APPENDIX-CODING-METHODS-DRAFT-v1.tex` (family table [totals indicative —
verify at assembly], per-code agreement table, merge rules, provenance; review at
assembly). Review outputs beyond the deliverables, session 2026-07-23: C2 struck +
blind-replicated · D1-A0A1 folded + blind-replicated · WE recount adjudicated + integrated
(floors 1/11/4/13, awareness-gap 12) · all-Fable re-pass + refresh (438 rows; F3-CARRY
18→7, F1-PRESENCE 25→19, A4-DIV 18→13, dark→ATTESTED) · α-MASI .82 · 7 adjudications ·
7th masked response · saturation restated · WE-avatar doctrine memorized.

**Standing cautions carried out of the audit** (for M3.5/M4.3/M0.3 drafting): the sole clean
activator quote (W26-R037) sits on Q10; no activation denominator exists in the instrument;
the locked M0.3 clause "as the data demonstrates" must be re-verified against the recount
results at the queued full-draft thesis re-verify (cost 0 wording either way); Part II
stations the paradigm solicitation at A₁ (Sonny hail) vs the outline's "solicited at A₂/A₃" —
adjudicate before M4.1; the two-channel rule and FCM three-forms vocabulary source from
`construct-crosswalk.md` §4 / the FCM corpus entry, NOT Part II v4 (Part II carries only the
one-paragraph second-form camp reading); F2-WORLD (n=4, all app-users) supports
exemplar-plus-direction claims only.
