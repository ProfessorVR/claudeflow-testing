# STEP A — Quotation verification ledger (2026-08-05)

**All verification against `archon-cli-v3` and nothing else.** Binary `target/release/archon` (v1.3.11), store
`.archon/`, index `index/` at the project root. Gate: **`match_kind == "exact"`**. A fuzzy hit is a FAIL however
high its similarity — no quotation enters prose on a fuzzy match.

Harness: `scratchpad/verify_quotes.py`, TSV of `unit_id <TAB> quote`.

---

## 0. TWO TOOL BEHAVIORS THAT PRODUCE FALSE FAILURES — check both before concluding a quote is wrong

1. **Hyphens break the FTS query parser.** `verify-quote "a relatively short-lived, flexible, multi-dimensional
   response"` returns `Error: FTS search failed ... exact scan fallback is capped at 2000 chunks`. Passing
   `--doc <document_id>` routes around it and the same quotation verifies **exact**. Any hyphenated quotation must
   be retried with `--doc` before it is called a failure.
2. **Unrestricted search can miss a quotation that is present.** `"to be no more, have no more, want no more"`
   returned no hit at all unrestricted and **exact** with `--doc`. Same for `"the other side of cognition"`
   (fuzzy 0.815 unrestricted, exact with `--doc`).

**Procedure adopted:** run unrestricted first; on anything short of exact, retry with `--doc`; only then treat it
as a real mismatch and go to `docs search` for the true wording.

## 1. TWO STRUCTURAL HAZARDS FOR CITATION

**Duplicate ingestion, different pagination.** Elpidorou and Freeman's chapter resolves in *two* ingested
documents, and their page numbers differ:

| document | locus for "it cannot be seamlessly assimilated…" |
|---|---|
| `Elpidorou and Freeman - Is Profound Boredom Boredom (2019).pdf` (standalone chapter) | pp. 1–3 |
| `Hadjioannou, C. (ed.) - Heidegger on Affect (2019).pdf` (the volume) | pp. 207–208 |

MLA cites the chapter *in* the collection, so the volume pagination is the one the works cited needs. **Every E&F
locus in this ledger records both.** Deciding which to print is a citation-assembly matter, not a verification one.

**PDF page ≠ published page.** Slaby's chapter is ingested as a standalone whose PDF pages start at 1, while the
index entry cites the published pagination (pp. 101–120). The attunement quotation sits at PDF pp. 5–6 and
published pp. 105–106. **Per the standing rule, the printed locus is read from the running head, never computed
from a PDF page offset.**

---

## 2. L1 ¶2 — the phenomenological literature (`bor-sec-04`, `bor-sec-13`)

### VERIFIED EXACT — usable in prose

| # | quotation | source | locus |
|---|---|---|---|
| Q-A01 | it cannot be seamlessly assimilated to any known category of boredom | Elpidorou & Freeman | chapter pp. 1–3 · volume pp. 207–208 |
| Q-A02 | the first is itself presumably still rooted in the possibility of the third | E&F quoting FCM 156 | chapter pp. 18–20 · volume pp. 223–225 · **also resolves in FCM itself, pp. 153–155** |
| Q-A03 | as if one experiences trait boredom but only for a moment | Elpidorou & Freeman | chapter pp. 22–23 · volume pp. 227–229 |
| Q-A04 | a relatively short-lived, flexible, multi-dimensional response | Elpidorou & Freeman | chapter pp. 10–11 *(required `--doc`)* |
| Q-A05 | it does not shake us up | Elpidorou & Freeman | volume pp. 218–219 |
| Q-A06 | the other side of cognition | Slaby | PDF pp. 1–2 *(required `--doc`)* |
| Q-A07 | to be no more, have no more, want no more | Slaby, quoting Pessoa | PDF pp. 17–18 *(required `--doc`)* |

**Q-A02 is worth noting twice over.** It resolves exact in three places — E&F's chapter, the Hadjioannou volume,
and *The Fundamental Concepts of Metaphysics* itself. It is Heidegger's sentence, which E&F quote. If the section
wants Heidegger's claim it cites FCM directly; if it wants E&F's *use* of it against the sui-generis reading, it
cites the chapter. The two are different moves and the ledger keeps them apart.

### FAILED THE GATE — the index entry's wording is not verbatim

**Q-A08 · `bor-sec-04`.** The entry gives, in quotation marks:

> "to investigate profound boredom's place within contemporary psychological and philosophical research on
> boredom" (p.2)

The document reads:

> In this chapter, we undertake a study of the nature of profound boredom with the aim of **investigating its
> place within contemporary psychological and philosophical research on boredom**.

The entry's version is a paraphrase wearing quotation marks. **Quotable span, verified exact:**
*investigating its place within contemporary psychological and philosophical research on boredom.*

**Q-A09 · `bor-sec-13`.** The entry gives:

> "each attunement is understanding and each understanding has its attunement" (p.105–106)

The document reads:

> Since, according to Heidegger, each attunement **"is understanding"** and each understanding has its attunement
> (Being and Time p. 335, see also p. 142)

The entry dropped Slaby's own internal quotation marks, which is why it scored 0.973 rather than exact. **Quotable
span:** *each attunement "is understanding" and each understanding has its attunement* — rendered in LaTeX with
the inner marks preserved. Two further cautions: this is **Slaby's** sentence, not Heidegger's, and Slaby cites it
to *Being and Time*, not to FCM. Using it as an FCM gloss would misattribute it.

### RECOVERED WHILE VERIFYING — E&F's own methodological warning, verbatim

The passage around Q-A01 carries a sentence the entry paraphrases but does not quote, and it is more useful to
this section than the paraphrase was, because it is E&F prohibiting exactly the move the section must avoid:

> It cannot be assumed that Heidegger's (profound) boredom is identical to either our colloquial or scientific
> understanding of boredom. Nor can one use Heidegger's account of this type of boredom to make general claims
> about the phenomenon of boredom.

**Verify before use** — it was read from the returned source span rather than through the gate, so it is
`****** PENDING GATE` until run through `verify-quote` in the next batch.

---

## 3. THE MAIN BATCH — 217 candidates from the other sixteen entries

Extracted mechanically (`extract_quotes.py`) and gated (`gate_quotes.py`); full results in
`STEP-A-GATED-QUOTES-2026-08-05.tsv`.

**A note on the extractor, because the first attempt was wrong.** The entries use only straight double quotes —
3,666 of them, zero curly — so pairing must be sequential, and doing that across a whole file is fragile: one
unpaired quote flips the parity for everything after it, producing spans that run from the CLOSE of one
quotation to the OPEN of the next. The first run produced 334 candidates of which 14 of the first 24 failed,
almost all of them artifacts. Pairing **per line** contains the damage and cut the set to 217 real candidates.

### Result

| | candidates | exact | fail |
|---|---|---|---|
| all sixteen entries | 217 | 167 | 50 |
| **English sources only** (`bor-sec-11` excluded, §3.1) | **200** | **161** | **39** |

### 3.1 `bor-sec-11` is DROPPED — non-English

Author ruling 2026-08-05: ignore any article not written in English. Hernández Albarracín, Álvarez González and
Pallarès Piquer is Spanish-language (*Tópicos, Revista de Filosofía* 62, 2022). **All eleven of its failures
were English renderings of Spanish text**, which cannot verify verbatim by construction. The entry is out, no
works-cited entry is needed, and L1 ¶3 rests on Quaranta alone. **It is the only non-English source among the
eighteen** — the other seventeen were checked and are English.

### 3.2 The 39 remaining failures decompose

| n | kind | disposition |
|---|---|---|
| 12 | **ellipsis-elided** — the entry compressed a quotation with `...`, so it cannot match exact | recoverable: restore the elided text or verify the segments separately |
| 8 | **entry tagging / cross-references** — debate-axis labels (`↔`), reference-list fragments, cluster IDs | not quotations; extraction noise |
| ~11 | **section titles and entry prose** caught by the extractor | not quotations |
| **~8** | **genuine unverified candidates** | must have their true wording found before use |

The genuine tail, needing `docs search` before any of them enters prose: *slipping away from ourselves toward
whatever is happening* (Mansikka) · *internally directed attention or mind-wandering* · *time passing slower
than usual* (Perone) · *lower alpha = cortical activation* (Perone) · *would predict higher levels of misses,
rather than false-alarms* (Yakobi) · *the holistic sensation that people feel when they act with total
involvement* (Csikszentmihalyi via Nacke) · *gets us unstuck when we find ourselves stuck* (Elpidorou) ·
*without relying on any specific genre of content*.

## 4. WHAT REMAINS IN STEP A

**Done:** all seventeen English entries read or worked; 168 quotations verified exact across both batches; the
three structural hazards recorded (S-04's false-failure modes, duplicate ingestion with divergent pagination,
PDF page ≠ published page); five bibliographic and attribution findings banked as A-02 through A-09 in register
v8.

**Not done, and blocking L1 drafting:**
1. The **four un-indexed documents** — Eastwood (2012), Fahlman (2013), Mugon et al. (2020), van den Brink et al.
   (2016) — have not been read from the store. Eastwood and Fahlman carry the definitional spine, and their six
   anchor quotations were verified in an earlier session (register §G), but the documents themselves have not
   been read in this one.
2. The **`_synthesis` layer** named in handoff §0.3 — the debate map on DA-01 through DA-04 and DA-07, the
   construct-measure concordance §2 and §7, the scholarly-evolution arc, the citation network §2.
3. The **~8 genuine unverified candidates** above.
4. The **12 ellipsis-elided quotations**, if any of them is wanted in prose.

**Standing finding: the index entries put paraphrases inside quotation marks, and use ellipses inside quoted
spans.** Nothing from an entry enters prose without passing the gate in its own right.
