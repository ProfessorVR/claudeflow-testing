# SITREP — Part II COMBINED v2 revision (2026-07-01)

## Active file & workflow
- **LIVE DRAFT (all edits here):** `tmp/Dissertation/Part_II/Part-II-COMBINED-v2-2026-07-01.tex`
- **DO NOT TOUCH the original:** `Part-II-COMBINED-v1-2026-06-30.tex` (read-only reference).
- **`.pdf` and `.md` are STALE** — both are the Jun-30 v1 build; they do **not** reflect any v2 work. Only `v2.tex` (+ compile `.xdv`) is current. Regenerate a v2 PDF with a full build when a read-through is wanted.
- **Interactive workflow:** user dictates an issue/change → assistant proposes → user rejects/modifies/**accepts** → assistant applies to v2. One paragraph at a time.
- **User's line numbers track their v1 read-through** and can run a few lines off from v2 — **locate edits by content, not the raw line number.**

## Conventions established this session (MUST follow)
- **Quotation marks use LaTeX markup: `` ``…'' `` for doubles, `` `…' `` for nested singles.** The whole document was normalized to this (218 pairs; 0 straight/curly Unicode quotes remain). **Never insert Unicode curly/straight quotes.** Apostrophes left as-is (render fine).
- **Backup before big/mechanical changes** → `.backups/<TIMESTAMP>-<label>.tex`.
- **Compiles clean** with XeLaTeX (biber, `polyglossia` greek, `\gk{}` = Gentium Plus). Build check: `xelatex -interaction=nonstopmode -no-pdf <file>` → expect exit 0, 35 pp, **zero** "Missing character" warnings.
- Ellipsis in quotes = Unicode `…`. Em-dash `—`, en-dash `–` for ranges/loci.

## Progress
**§2 (The Justification of the Method) — heavily revised, all 5 movements:**
- L217 typos (unaddressed; "in time, to remake"). L219/L221/L231: "motion by motion" fixed (chain reads *actualization to actualization, each motion carrying it into the next*). L297/L335/L369: accretion sense → "act by act".
- **¶225 recast** (producing/using art): de-referenced opening; flute→Aristotle's **helm** quote (*Phys.* II.2, 194b5–7) + **builder-knows-both** (194a23–26); "what divides the two is not what each knows but what each does"; efficient-cause **graded** (designer can't supply *desire* → not efficient cause of a *free* act; but can compel = *bia*).
- **L233:** two footnotes added — (a) ***bia*** defined from **NE III.1, 1110a1–4** (English Ross-rev-Urmson + Greek Bywater OCT 1894); (b) **Calleja push/pull channel-mapping** (cinematic=push narrative; soft=spatial; suffered=kinesthetic+ludic; inflicted/de-inverted=shared; affective=transverse). 
- **L235:** Heidegger footnote expanded with fuller BT 145 + BT 160 verbatim ("together with it we encounter the Dasein-with of Others").
- **L241:** *desire* qualified as ***orexis*** (pursuit **and** avoidance; boredom→leaving-off example). *(orexis locus still uncited — offer DA III.7 / DMA 6.)*
- **Document-wide quote normalization** → LaTeX markup. **L170** pre-existing typo fixed (added opening quote before "actualized" — potentiality/actuality pair; **user-CONFIRMED**).
- **L243:** "presses/pressing" clarified (world's supply doing work at a chain-point; fruit/goblin example).
- **L245:** (1) direct **L&J** quote → *Metaphors We Live By* **180** (+ "quoted by Calleja, *In-Game*, 168"); (2) **Rickert** dwelling-as-attunement → *Ambient Rhetoric* **27**; (3) page cites: "sense of habitation" 169, "inhabiting a place" 43–44.
- **L249:** magic-circle `(In-Game, 46–53)` + explanatory footnote (Huizinga's boundary; why Calleja excises it). ("large portion", not "forty percent".)
- **L257:** pentad footnote expanded (motive-question, *ratios*, action-vs-motion).
- **L259:** concluding ¶ made concrete (two-way axis restated; Burke "both joined and separate / individual locus of motives"); dropped the "That is what corroborates it…" sentence.

**`verbatim_passages.md`:** added **NE III.1, 1110a1–4** (*bia* / the involuntary) entry with locus-correction note.

**§3 (Introduction to the Applications) — JUST STARTED:**
- **L273 DONE:** Heim/Heidegger mis-attribution fixed — "Heidegger's structure of worldhood as a context of relationships (*Bewandtniszusammenhang*) … reflected in Michael Heim's analysis … which reads Heidegger's definition as suggesting that '…'" ; citation fixed to **Heim, *Virtual Realism*, 91**.

## RESUME HERE
Continue **§3 Introduction to the Applications**. Subsections & (v2) line anchors:
- The Virtual Environment as Rhetorical Ecology (§ opens ~L267; L273 just done)
- From Presence to Incorporation (~L291)
- Veri(dis)similitude: The Aim, Function, and Motive of the Virtual (~L301)
- Two Worlds at the Poles of the Medium (~L311)
Then §4 (*Gnomes & Goblins*, ~L319) and §5 (*RDR2* tutorial, ~L413).

## Source locations discovered this session (for future citations)
- **Lakoff & Johnson, *Metaphors We Live By*** — `corpus/rhetorical_ontology/Lakoff, George and Johnsen, Mark - Metaphors we Live By.pdf`. Experientialist view p.**180** ("our conceptual system emerges from our constant successful functioning…").
- **Rickert, *Ambient Rhetoric*** — `corpus/rhetorical_ontology/Rickert, Thomas - Ambient Rhetoric...(2013)...pdf`. Dwelling-as-attunement p.**27**; "modality of our dwelling" p.**209**; Part 2 = "Dwelling with Ambience".
- **Heim, *Virtual Realism*** — `corpus/new_media/Heim, Michael - Virtual Realism.pdf` (also in `corpus/metaphysics/`). Worldhood/*Bewandtniszusammenhang* passage p.**91**. NOTE: quote is **not** in *The Metaphysics of Virtual Reality* (checked).
- **Calleja, *In-Game*** (corpus/index entry) — magic circle **46–53** (core 46–48; spatial 48–49); six dimensions **43–44**; incorporation def + "sense of habitation" **169**; R1–R7 **169–173, 178**; **push/pull narrative** = ch.7 (C-030); experientialist grounding (L&J/Damasio/Dennett) **167–169** (L&J verbatim block at 168).
- **Heidegger *Being and Time*** (M&R 1962) — `corpus/rhetorical_ontology/Heidegger, Martin - Being and Time_(1962)...pdf`. BT 145 = H.111 (co-disclosedness of space); BT 160 = H.123 (Being-with co-constitutes worldhood).
- Aristotle *Physics* II.2 verbatim (helm/builder/using-art) + NE passages: see `tmp/Dissertation/verbatim_passages.md`.

## Backups
- `.backups/20260701T140833-pre-quote-normalization.tex`
- `.backups/20260701T144727-pre-L243-259-batch.tex`

## Open flags
- v2 **PDF/MD are stale** — regenerate for read-through.
- **orexis locus** (L241) left uncited — pending user pick (DA III.7 vs DMA 6).
- Build artifacts (`.aux/.log/.bcf/.xdv/...`) present in Part_II/ from compile checks — harmless.
