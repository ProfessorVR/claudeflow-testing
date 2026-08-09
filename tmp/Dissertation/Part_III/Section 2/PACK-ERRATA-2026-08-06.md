# PACK ERRATA — lab-boredom-L1-pack-v2 (found during Section 2 drafting, 2026-08-06)

Findings that must be folded into a pack v3 before any other module draws on these entries.
Pack v2 itself is left untouched.

## 1. Q21 — the cite string names the wrong author

**Pack v2 renders the source as "Nacke and Craig," and the corpus directory is named the same
way. Craig is Craig A. Lindley's given name, not a second surname.**

- Index citation field (`bor-sec-44`): `Lindley, Craig A., and Lennart Nacke. "Flow and
  Immersion in First-Person Shooters: Measuring the Player's Gameplay Experience."
  Proceedings of FuturePlay 2008, Toronto, ON, Nov. 3–5, 2008, pp. 81–88.`
- The quotation text is unaffected and verified; only the attribution is wrong.
- **Drafting workaround used:** the bare `«Q21»` marker, never `«Q21+»`, so the bad cite
  string could not enter the draft; the citation was typed as *Lindley and Nacke*.
- Same class of error as the Colin/Barrett trap from the desktop section: a storage handle
  mistaken for an author name.

**Fix in v3:** `"cite": "Csikszentmihalyi, qtd. in Lindley and Nacke"`; correct `source`;
correct the works-cited entry; the pagination in the index (81–88) supersedes the pack's
"pp. 1–2," which is an archon page index.

## 2. Q19 — unusable as a quotation in running prose

The span begins with a capital T and is a sentence fragment, so the bracket-lowercase rule
requires `[t]o avoid…`, which mechanical substitution cannot produce. Per the pack's own
recommendation for VanderWerf, the paragraph now **reports** the finding (the 334 ± 67 ms
blink measurement, Q18's content) and explains the attention control in prose.

**Fix in v3:** either store a pre-bracketed variant (`Q19b` = `[t]o avoid…`) or mark Q19
report-only, as Q18 already is.

## 3. Q14 — locus resolved

Pack v2 carries `RE-PIN`. Pinned this session by folio read: **printed p. 117** (running head
"The Other Side of Existence 117"; Slaby's note 18 gives Pessoa, *Book of Disquiet*, fragment
219, p. 192).

## 4. Four quotations verified in session and not in the pack

Held in `L1-addendum-quotes.json`; merged with the pack bank into `L1-bank-session.json`,
which is what substitution consumes. All verified `EXACT` via `archon docs verify-quote`
against `archon-cli-v3` @ `75d8c210`.

| ID | source | locus | use |
|---|---|---|---|
| Q26 | King & Salvo P2 (2024) | unpaginated ASEE; **Introduction**, PDF p. 3 | EEG noise — the drop rationale |
| Q27 | King & Salvo P2 (2024) | same | eye tracking's higher signal-to-noise ratio |
| Q28 | King & Salvo P2 (2024) | same | scalability via laptop and tablet webcams |
| Q29 | Raffaelli et al. (2018) | printed p. 2452 | the state/trait distinction |

**Q26–Q28 are body text, not abstract** — checked explicitly, since the no-abstract-quotations
lock would otherwise bar them. They sit in the Introduction paragraph beginning "Pre- and
post-survey information from prior studies…".

## 5. Standing convention refined by the author this session

A colon-introduced quotation keeps its capital **only when the quoted span is a full
sentence**. A fragment introduced by a colon is bracket-lowercased like any other
mid-sentence quotation. This tightens the desktop-section rule, which had treated
colon-introduction alone as sufficient warrant for keeping the capital.
