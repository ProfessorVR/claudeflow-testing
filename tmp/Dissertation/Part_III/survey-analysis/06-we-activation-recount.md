# 06 — WE Activation-Status Recount (raise-the-resolution pass)

**Status: SIGNED OFF + ADJUDICATED + INTEGRATED (2026-07-23, Station 3 of the coding review).**
Built 2026-07-23 per the approved alignment-audit ruling: raise the WE evidence's resolution
BEFORE drafting M3.5/M4.3. The user signed off on the agreed counts and adjudicated all 8
disputed rows (rulings below); integration items 1–3 are EXECUTED (F7 recount addendum in
05-findings; recount table in t3-stats; M3.5 spec locked). Item 4 (disclosure) rides the
Station 6 ruling.

## Method
- **Candidate set** (`coding/we-recount-candidates.csv`, 115 rows): all E-SHA rows (67) ∪ a
  documented keyword sweep over the full 873-row corpus (`alone / isolat / discord /
  watch-with|together / meetup|meeting / multi-user / collaborat / community / together /
  classmate / peers / avatar`) — 48 keyword-only rows, because the audit showed the corpus's
  strongest non-activator reports were not E-SHA-coded.
- **Taxonomy** (one primary bin per row; deployment-experience reports outrank wishes):
  ACTIVATOR · NON-ACTIVATOR · OPTATIVE-MANDATE (structure/schedule the meet) ·
  OPTATIVE-CAPABILITY (capability requested as if absent — awareness-gap candidate) ·
  COURSE-SOCIAL (course-level social talk, no platform reference) · HYPOTHETICAL-USECASE
  (Q10-register proposals beyond the course) · NOT-WE (sweep false positive).
- **Two independent blind passes** (both Fable 5, matching the corpus protocol; same
  disclosure question as the main coding — Station 6 ruling applies), deterministic compare
  (`scratchpad compare-recount.py`). Pass files: `coding/we-recount-pass1.txt`, `-pass2.txt`;
  agreed rows: `coding/we-recount-agreed.tsv`; disagreements:
  `coding/we-recount-disagreements.tsv`.

## Agreement
**107/115 = 93.0% exact single-bin agreement** (vs. the corpus's 0.878 mean Jaccard on
multi-label sets — different measure, comparable strength). All 8 disagreements sit on ONE
boundary: hypothetical-proposal vs. optative (7 of 8 involve OPTATIVE-CAPABILITY/-MANDATE);
zero disagreement anywhere on the deployment-experience bins (ACTIVATOR, NON-ACTIVATOR
identical in both passes, row for row).

## Agreed counts (mention-level FLOORS — see ceiling note)
| Bin | n | terms (W25/S25/W26) | items |
|---|---|---|---|
| ACTIVATOR | **1** | 0/0/1 | Q10 (W26-R037) |
| NON-ACTIVATOR | **11** | 7/3/1 | Q10×10, Q6×1 |
| OPTATIVE-MANDATE | **3** | 1/1/1 | Q9×1, Q10×2 |
| OPTATIVE-CAPABILITY | **10** | 5/3/2 | Q9×5, Q10×5 |
| COURSE-SOCIAL | 28 | — | — |
| HYPOTHETICAL-USECASE | 47 | — | — |
| NOT-WE | 7 | — | — |
| *(disputed, queue below)* | 8 | — | — |

**Ceiling note [stated limit]:** the instrument never asked whether the assigned group
convened in-world, so no activation *denominator* exists; every number above is a floor of
incidental mentions, never a rate. M3.5 must phrase these as mention-floors and M6 carries
the consequence.

## What the counts say (FE counts; P readings)
1. **The activator:non-activator floor is 1:11.** The sole activator confirmation in 873
   responses remains W26-R037/Q10 ("The main pro to the platform is you can watch with
   others"). The eleven non-activators include direct in-platform reports ("when I did log
   in, I was usually alone in the platform" W25-R038; "my group utilized discord a lot"
   S25-R072; "didn't actually experience [the meet]" W25-R014) — M3.5's "activators name
   co-watching the main pro" must be SINGULAR, and the module's center of gravity shifts to
   the non-activation record, which is now well-attested.
2. **The awareness gap is real and sizable [FE]:** 10 agreed (up to 15–16 pending
   adjudication) request multi-user/co-watching capability in wording that implies it does
   not exist — e.g., "if there was a way to interact with other users who are online at the
   same time" (W25-R071/Q9); "perhaps the ability to meet up with groups in a virtual
   reality setting" (W26-R022/Q10, the platform's exact existing capability). Reading [P]:
   the F7 correction's "the only gap is student-side activation" refines to activation ∧
   awareness — part of the class never learned the meet was possible. This is rung 0 of the
   M5.2 ladder (added to the outline 2026-07-23).
3. **Structure requests exist and are student-designed [FE]:** 3 agreed — a required group
   meetup (W26-R052/Q9), a class sheet of group-chosen entry times (W25-R060/Q10), weekly
   VR-space team meetings (S25-R040/Q10) — students independently proposing M5.2's
   scheduling-infrastructure and graded-session rungs.
4. **Term texture [FE, composition caveat]:** non-activators are W25-heavy (7/3/1), the
   activator is W26. No trend claim — cohort composition differs (02 limitation 4); report
   as texture only.
5. **Duplicate handling:** the verbatim-identical pair S25-R021/W26-R011 (Q10) both sit in
   the disputed queue with the same split — adjudicate identically and COUNT ONCE
   (02-codebook-final limitation 4, extended 2026-07-23).

## Adjudication queue (8 rows — user rules at Station 3; recommendations included)
| Row | Pass1 vs Pass2 | Text (abridged) | Recommendation |
|---|---|---|---|
| S25-R021/Q10 + W26-R011/Q10 (dup) | HYPO vs OPT-CAP | "maybe a vr simulation with multiple characters… in one room together" | HYPOTHETICAL (conservative — generic proposal; count once) |
| S25-R028/Q10 | HYPO vs OPT-CAP | "you could meet online… go up to each procedure… explain to other groupmates" | OPT-CAPABILITY (deployed-platform referential, capability framed as new) |
| S25-R043/Q10 | HYPO vs OPT-MANDATE | "having the professor or instructor logged in at the same time, explaining" | OPT-MANDATE (organized synchronous session request) |
| S25-R063/Q10 | NOT-WE vs HYPO | "creating scenarios… through using avatars" | HYPOTHETICAL (social content present; not deployment-referential) |
| W25-R043/Q10 | HYPO vs OPT-CAP | "could be neat especially if we could explore with groupmates" | OPT-CAPABILITY (co-use framed as unavailable) |
| W25-R084/Q10 | HYPO vs OPT-CAP | "arranging private rooms where we can meet virtually… for more than just this class" | OPT-CAPABILITY (capability framed as absent) |
| W26-R022/Q10 | HYPO vs OPT-CAP | "perhaps the ability to meet up with groups in a virtual reality setting" | OPT-CAPABILITY (cleanest awareness-gap case) |

**RULINGS (user, 2026-07-23 — all 8 rows adjudicated):** dup pair S25-R021+W26-R011 →
HYPOTHETICAL, counted once · S25-R028 → OPT-CAPABILITY (context review: an app-user who was
in-world and still frames the meet as absent — "beneficial to have… you could meet online";
"if improvements could be made, it could allow for better collaboration") · S25-R043 →
OPT-MANDATE · S25-R063 → NOT-WE (**AUTHOR doctrine 2026-07-23:** WE can ride on human- OR
computer/program-controlled avatars — either/both can serve rhetorical incorporation and
co-disclosedness — but avatar-mention alone ≠ WE; this row is first-person embodiment talk
with no co-present other) · W25-R043 → HYPOTHETICAL (author insight: "if we could" is
plausibly conditional on the imagined new spaces, not counterfactual about capability;
demoted from the OPT-CAP recommendation) · W25-R084 → OPT-CAPABILITY **as a genuine feature
request** (AUTHOR-CONFIRMED 2026-07-23: reservable private rooms are NOT an existing
capability — excluded from the awareness-gap subset) · W26-R022 → OPT-CAPABILITY.

**FINAL FLOORS (adjudicated):** ACTIVATOR 1 · NON-ACTIVATOR 11 · OPTATIVE-MANDATE 4 ·
OPTATIVE-CAPABILITY 13 (awareness-gap subset 12, excluding W25-R084) · COURSE-SOCIAL 28 ·
HYPOTHETICAL 49 counted (50 rows; dup counted once) · NOT-WE 8. [Supersedes the
recommendation-based projection previously recorded here, whose "(13 unique after dup
discount)" parenthetical was internally inconsistent — under the rulings the dup pair sits
in HYPOTHETICAL, and OPT-CAP's 13 are 13 distinct respondent-rows.]

## Integration plan — items 1–3 EXECUTED 2026-07-23 (backup `.backups/20260723T132352/`); item 4 RULED (d) hybrid 2026-07-23
1. Append a dated recount addendum to 05-findings F7 (floors, awareness-gap refinement,
   singular-activator correction); leave the author's 2026-07-13 correction block intact.
2. Add the recount table to t3-stats.md; note the E-SHA-filter insufficiency (5 of 11
   non-activators are non-E-SHA rows).
3. M3.5 drafting spec: mention-floor phrasing; singular activator; non-activation as the
   evidenced pole; awareness ∧ activation as the two gap mechanisms; M6 carries the
   no-denominator ceiling.
4. Disclosure: this recount is two blind AI passes (both Fable 5) — same methods-transparency
   ruling as the main corpus. RULED 2026-07-23, option (d) hybrid: in-prose clause in M2.2 ¶2
   + substantive footnote at the reliability sentence; the recount passes are named in that
   footnote.
