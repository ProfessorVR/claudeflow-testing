# The archon-cli-v3 index, indexing system, and entry-authoring format — analysis

*Read-only analysis of `~/projects/archon-cli-v3` @ `75d8c210` (branch
`feat/pdf-native-extraction`, working tree clean). Nothing in that repo was
modified. All numbers are read from committed artifacts, manifests, and the
generated intermediates under `.archon/corpus-import/`; the Cozo store itself was
not queried, because every `archon` invocation opens it mutably (see §8.9).*

---

## 1. What this system is for

One sentence from `docs/ingestion-and-corpus-index.md` governs the whole design:
**citation precision with provenance**. Every sentence of every ingested document
should be addressable to page and bounding box, and every authored analytical
claim should be machine-verifiable against the exact source text it cites.

The concrete motivation is dissertation-shaped: a body of philosophical and
empirical literature is being read, argued about, and quoted, and the quotations
must survive advisor-grade scrutiny. The system's answer is to make an *authored
research index* a first-class database with its own schema, import gates, and
verification scans — so that "I quoted this" becomes a checkable proposition
rather than a habit of care.

The design philosophy is stated plainly in `index/AUTHORING-FORMAT.md` §1 and
proven out by the code: **machine gates, not operator virtue**. Every rule that
matters is enforced at a boundary — schema contract, quote gate, identity guard,
per-entry checker, corpus scan — and the format explicitly says what remains on
the human ("writing true claims, choosing good quotes, running the checker").

---

## 2. The three stages, and where "the index" actually lives

```
source PDF ─▶ [1 INGESTION] ─▶ [2 SEMANTIC INDEXING] ─▶ retrieval-ready
                   │
                   ▼                  [3 CORPUS-INDEX ENTRIES]
     chunks + sentences + bboxes  ◀───  clauses / claims / edges / tensions
     + locators + provenance            (quote-gated at import)
```

The word "index" carries three different meanings in this repo, and conflating
them is the main source of confusion:

| Sense | What it is | Where it lives | Command |
|---|---|---|---|
| **Vector index** | HNSW snapshot + RocksDB raw vectors over chunk embeddings | `.archon/doc-vector-store/` | `archon docs index` |
| **Corpus index** (the subject here) | authored claim/clause/edge/tension records | Cozo `corpus_*` relations in `.archon/archon-data.db` | `archon corpus-index …` |
| **Index tree** | the human-readable prose half, one folder per entry | `index/` at the repo root | files |

`index/INDEX-OWNERSHIP.md` declares **Phase D** as of 2026-08-05: archon-cli-v3
is the authoring home for both halves; `claudeflow-testing/corpus/index` is
frozen as reference. That replica currently holds 27 entry folders and none of
the ten 2026-08 entries — the divergence is real and intended.

### Stage 1 — ingestion

`archon docs ingest` per document: content-hash dedup → scan classification
(three-detector union) → coordinate extraction by best-first route (born-digital
→ `pdftotext -tsv` native sidecar with mathematically exact boxes; scanned →
Marker OCR; fallback → flat text with `coord_space = "none"`, never silent) →
token-aware chunking with per-chunk spatial rows, per-block boxes, page-break
maps, locator capture → **inline sentence layer** (byte-spanned, sha-verified,
per-sentence page + tight bbox) → **admissibility gate** (ligature dropout,
degenerate extraction, missing sentences, or bbox-less Marker fallback ⇒ document
is `Failed`, not admitted) → chunk-integrity hashes folding into `chunks_root`.

The ordering invariant is the point: a document cannot reach `Ingested` status
without a sentence layer that matches its text — enforced on `docs reprocess` too.

### Stage 2 — semantic indexing

`archon docs index` drains a durable queue and ends every run — even an empty
one — with a **completion audit**: any chunk of an `Ingested` document that is
not `indexed` is a hard error. A green run is therefore a standing attestation
that retrieval sees the whole corpus. Embedding is deliberately decoupled from
ingest for bulk work because eager per-chunk indexing rebuilds the whole HNSW
snapshot per insertion (~8 min/chunk at ~27k vectors — documented as the top
open architectural defect).

### Stage 3 — the corpus index

Authored entries enter through `archon corpus-index import <kind> <file.jsonl>`.
Imports are schema-validated, batched as keyed upserts, and quarantined *per
record*. For clauses the quote-verification gate is **on by default**.

---

## 3. The data model

`crates/archon-knowledge/src/corpus.rs` (887 lines) defines eight relations:
`corpus_sources`, `corpus_clauses`, `corpus_claims`, `corpus_edges`,
`corpus_tensions`, `corpus_terms`, `corpus_groups`, plus `corpus_imports` as the
audit trail. Two Cozo FTS indices were added 2026-08-06 (`corpus_clauses:quote_fts`,
`corpus_claims:text_fts`).

The record model is a small argument ontology:

- **source** — one work per edition; carries `archon_document_id` (empty = cited-only), sha256, bibliography, rights tier, extraction notes.
- **clause** — the *verbatim evidence layer*: one quote, anchored to a document by `text_layer_id: archon:<doc-id>`, with page/bbox/chunk seeds and a citation address.
- **claim** — one assertion in the author's own words, typed (`claim_kind`), with stance, support tier, provenance, derivation, and `clause_refs_json` pointing at its evidence. 38 columns, most optional.
- **edge** — typed relation between two ids (`grounds`, `qualifies`, `contests`, `conflicts-with`, `glosses-greek`, …). Cross-entry endpoints are legal — this is how entries talk to each other.
- **tension** — a named two-pole (or one-pole) conflict with member claims and evidence loci. This is the debate-map primitive.
- **term / group** — corpus-global: canonical vocabulary, and *sets* of sources treated as one object.

Three design constraints are explicit and honored in the DDL:

1. **Cozo has no `ALTER`** — the column set is a redo cost, so complex sub-objects ride as validated-JSON `*_json` string columns. Vocabulary evolution becomes a value change, not a migration.
2. **Decision 1 (2026-07-29)** — the exact span is always stored on clause rows; `rights_tier` + `redact_on_render` govern *display*, never storage. (Not currently honored by the authoring path — see §8.5.)
3. **C2 byte-vs-char** — offset columns are `span_start`/`span_end` with an explicit `offset_semantics` column, never a `char_*` name holding bytes. `corpus::offsets` is the single conversion point and carries Greek/German round-trip tests.

Row conversion (`row_from_json`) is strict in a way that matters: **unknown
fields are errors**, not silent drops — inverting the "extra-slot" defect the
audit found elsewhere. Missing optionals default (`""`, `-1`, `false`, `"null"`);
missing key or required fields, type mismatches, and unparseable embedded JSON
all route the record to quarantine. Writes go through the archon-cozo guard
(single-writer lock + busy retry) in batched multi-row puts.

---

## 4. The authoring format (v1.1, `index/AUTHORING-FORMAT.md`)

Declared 2026-08-05 as the single format for all new entries, merging the
historical `prose:` and `sandbox:` dialects. It incorporates a two-critic
adversarial review (28 findings), and the response to that review is the
document's most interesting property: nearly every finding was answered with a
*gate* rather than a paragraph of advice.

### The entry as a two-halved object

An **entry** is the unit of authored analysis about one work (or one scoped part
of one). It has a prose half (a folder under `index/`) and a machine half (JSONL
imported into `corpus_*`). The link is `manifest.json` — declared to be "a
machine contract, not a convention":

```json
{ "entry_id": "fahlman-msbs-2013", "scope": "whole-work",
  "source_ids": ["src:fahlman-msbs-2013"],
  "counts": {"sources":1,"clauses":9,"claims":12,"edges":15,"tensions":2},
  "authored_at": "2026-08-05", "format": "corpus-v1/authoring-1.1" }
```

Because `check-entry.py` E3 compares the manifest against the store, a crash
mid-import or an abandoned entry becomes *detectable* rather than a silent husk.

### Id namespacing is collision-proof by construction

The store writes by keyed upsert — a duplicate id silently overwrites. So every
id is namespaced by the full entry slug (`cl-<entry>-NNN`, `claim-<entry>-NNN`,
`edge-…`, `ten-…`), and `source_id` carries a mandatory shorttitle
(`src:<author>-<shorttitle>-<year>`). The stated reason is empirical: "same
author + same year is the common case, not the edge case" — the store already
holds two Elpidorou-2018 papers.

### The spec is canonical and complete

Nobody hand-writes JSONL. One declarative `entry-spec.json` lives beside the
manifest, and `scripts/author-entry.py` generates everything from it:

```bash
scripts/author-entry.py "index/<Entry>/entry-spec.json" --check   # verify only
scripts/author-entry.py "index/<Entry>/entry-spec.json"           # write
```

The helper resolves every anchored quote through `docs verify-quote`, seeds
chunk_id/page/bbox/similarity, emits every JSONL kind *plus* the manifest, and
**refuses to write anything if a quote fails** — so the import gates never see a
bad row. The format is emphatic that a spec describes the *whole* entry, never a
patch: a partial "extension spec" would regenerate an under-declaring manifest
and fail E3. Regeneration is therefore total, and counts cannot drift.

Author-time pre-flight (before any verification or writing): duplicate `n` values
per kind, claims referencing undefined clauses, ellipsis in quotes without an
explicit `ellipsis_ok`, and anchored quotes under four words.

### Scope profiles and group entries

The old "sandbox" excerpt case is now just an entry with a declared scope
(`"scope": "excerpt: De Anima III.3"`). More interesting is the **group entry** —
an entry whose unit of analysis is a *citation set* rather than a work. Group A
(`grp-vr-phenomenology-framing`) exists to record that three VR-phenomenology
sources are "invoked as a single undifferentiated gesture… the framing is invoked
but inert," with a `grouping_rationale` explaining that individual entries would
"manufacture argumentative weight none of them carries," and a `promotion_rule`
naming the condition under which a member graduates to its own entry. That is a
genuinely novel modeling move: it makes *citation behavior* a first-class
analytical object, and it keeps the index honest about the difference between a
source that is used and a source that is merely named.

### Style locks (S-01) — a check that cannot touch verbatim

`index/vocab/style-locks.txt` holds explicit American-spelling forms
(`behaviour → behavior`, `modelled → modeled`, …) with a deliberate refusal to
use morphological patterns ("a pattern rule fires on surprise, expertise,
precise… and a check that cries wolf gets waived"). E11 enforces it over
*authored prose only*: it never opens the clause table, blanks quoted spans in
the fields it does read, and skips markdown blockquotes. The stated reason is
worth quoting — a checker that pressured edits to quoted text "would manufacture
the paraphrase-in-quotation-marks defect it exists beside." Per-entry
`style_lock_exceptions` (form → reason) handle translator's technical terms
(McNeill & Walker's "behaviour" for *Benehmen*); accepted hits are reported by
name every run, and a declared exception with zero hits is itself a FAIL so dead
exceptions cannot linger.

---

## 5. The toolchain and the import protocol

Intermediates live one directory per entry: `.archon/corpus-import/<entry_id>/<entry_id>-<kind>.jsonl`.

```bash
E=fahlman-msbs-2013; D=.archon/corpus-import/$E
archon corpus-index validate clauses $D/$E-clauses.jsonl          # contract rehearsal
archon corpus-index import  clauses $D/$E-clauses.jsonl --dry-run # gates run, nothing written
archon corpus-index import sources  …    # identity guard ON
archon corpus-index import clauses  …    # quote + anchoring guards ON
archon corpus-index import terms    …    # BEFORE edges
archon corpus-index import claims   …
archon corpus-index import tensions …
archon corpus-index import edges    …    # endpoints now all present
archon corpus-index import groups   …
```

Import order is not stylistic — it is the dependency order that leaves only the
claims↔tensions mutual reference unresolved between two adjacent steps, which
`check-entry.py` then closes.

**Definition of done** (machine-checked, not arithmetic): every kind imported;
every `*.quarantine.jsonl` triaged to zero and deleted; `check-entry.py <entry>`
returns PASS; and after a batch — always after §8 surgery —
`scripts/verify-corpus.sh` runs corpus-globally.

Full CLI surface: `ensure-schema`, `status`, `validate`, `import`, `dump`,
`show`, `remove`, `probes`, and (2026-08-06) `search` + `clauses-for-chunk`.

---

## 6. The gates, as actually implemented

| Gate | Where | What it really enforces |
|---|---|---|
| schema contract | `row_from_json` | unknown/missing/mistyped fields; unparseable embedded JSON |
| quote gate | `gate_clause_records` | anchored quote located in its pinned doc: exact, or similarity ≥ 0.90 |
| ellipsis rejection | same | a quote carrying `…`/`...` that verifies only fuzzy is an elision/splice → quarantined (a source's own ellipsis verifies exact and passes) |
| min-length | same | anchored rows under 4 words rejected |
| anchoring guards | same | foreign `text_layer_id` schemes rejected; an *unanchored* row whose source **is** ingested is rejected ("unverified quotes wearing cited-only camouflage") |
| source-identity guard | `gate_source_records` | `source_id` re-used with a different sha256/title → quarantine (needs `--replace-sources`); one `archon_document_id` already owned by another `source_id` → quarantine |
| per-entry checker | `scripts/check-entry.py` | E1–E14 (below) |
| corpus scan | `scripts/verify-corpus.sh` → `phase7_verification_scan.py` | 22 checks in four layers, exits non-zero on FAIL |

**What the quote gate does *not* do**, stated explicitly in the format doc: it
verifies the quote lives in the pinned document; it does **not** check the seeded
`chunk_id`/`page_pdf`/spans/bbox. Matching is *normalized*, not byte-identical —
case, smart quotes, dashes, soft hyphens, whitespace. "Exact" therefore means
normalized-exact.

`check-entry.py` E1–E14: manifest presence and agreement · folder shape ·
counts vs store · claim→clause ownership within the entry's sources · unit-id
namespacing · edge endpoint resolution · tension member resolution · anchoring
completeness plus a 3-row spot verification · vocabulary (WARN) · quarantine
hygiene · style locks · ellipsis (WARN) · **clause reachability** (every authored
clause must be referenced by ≥1 claim — the orphan that hid `phf-fcm-0573`) ·
**claim evidence coverage** (WARN under 90%).

The corpus scan's A–D layers: document-store integrity (status census,
`chunks_root`, sentence-layer presence, source-path resolution, sentence-bbox
coverage ≥ 98%, duplicate page hashes, ligature dropout) · vector layer (queue
drained, every Ingested chunk embedded, raw-vector count sane) · corpus-index
referential integrity (C1–C10) · sampled content truth (100 random anchored
clauses re-verified). The accepted row census lives in a *file*
(`.archon/corpus-import/census.json`) with an `--accept-census` flag, precisely
because "a hardcoded census fails every healthy corpus the day after it is
written."

---

## 7. Current state (measured)

**Document layer** — 242 documents ingested, 0 failed, 13,591 chunks, 493,292
sentences at 98.39% bbox coverage, 43,004 raw vectors, index queue drained
(`reports/verification-scan-2026-08-06.md`: 20 PASS / 2 WARN / 0 FAIL). 261 PDFs
sit under `corpus/`.

**Corpus index** — accepted census: 89 sources · 8,553 clauses · 5,571 claims ·
21,319 edges · 133 tensions · 0 terms · 52 groups ≈ **35,600 rows**.

**Ten entries authored under v1.1**, all reported PASS with every anchored quote
exact:

| entry | clauses | claims | edges | tensions | groups |
|---|---|---|---|---|---|
| `heidegger-fcm-1929` | 330 | 182 | 428 | — | — |
| `king-salvo-physio-2023` | 25 | 18 | 19 | 4 | — |
| `fahlman-msbs-2013` | 9 | 12 | 15 | 3 | — |
| `vanderwerf-eyelid-2003` | 8 | 9 | 9 | 2 | — |
| `eastwood-unengaged-2012` | 7 | 8 | 7 | 2 | — |
| `vandenbrink-pupil-2016` | 6 | 6 | 7 | 1 | — |
| `mugon-proneness-2020` | 3 | 5 | 6 | — | — |
| `grp-program-lineage` | 3 | 5 | 6 | 1 | 1 |
| `grp-vr-phenomenology-framing` | 1 | 4 | 5 | 1 | 1 |
| `grp-methods-references` | — | — | — | — | 1 |
| **total** | **392** | **249** | **502** | **14** | **3** |

So the v1.1 population is **~4.6% of clauses and ~4.5% of claims** in the store.
Everything else is legacy.

**The legacy debt is quantified** (`reports/legacy-index-ledger-2026-08-06.md`):
3,673 of 8,553 clauses (42%) are referenced by no claim — all ten new entries are
at zero orphans, so the debt is wholesale legacy (`prose:fcm` 1455/1785,
`prose:bcap` 492/492, `prose:bt` 428/428, …). Batch re-anchoring was tested and
rejected: a 12-row probe of `prose-extraction` quotes returned 0 exact / 6 fuzzy
/ 6 no-match, and **1,079 of 3,981 prose rows carry authored apparatus inside the
quote field** (FAITHFUL/PARAPHRASE tags, GA citations, markdown emphasis) — they
are structured paraphrase, with nothing to re-anchor *to*. Ellipsis
classification: 117 spliced-fuzzy (repairable), 199 degraded, 17 no-match, 6
legitimate source-own. Policy (§9): legacy is frozen, repair-on-touch only, full
convergence deferred to the post-draft re-authoring pass.

**The live analytical structure** works. Three tensions converge on
`claim-heidegger-fcm-1929-085` ("what is boring does not come from outside: it
arises out of Dasein itself"), and the lineage Eastwood → Fahlman → King & Salvo
traverses as `grounds` edges. The Fahlman entry demonstrates the payoff: a quoted
Bernstein passage ("their dominance may alternate within one person") grounds a
claim that within-episode alternation makes Welch-PSD window averaging cancel the
signal it hunts — an argument built out of anchored clauses, typed edges, and a
named tension rather than out of prose alone.

---

## 8. Findings, in order of consequence

### 8.1 The corpus index has no reader inside archon

`corpus_*` relations are referenced in exactly three files: `corpus.rs` (the
schema/store), `corpus_index.rs` (the CLI), and `corpus_index_verify.rs` (the
gates). Nothing in retrieval, `archon-knowledge`'s own `kb_*` layer, the MCP tool
bridge, the TUI slash surface, or any drafting path reads it. It is a
write-and-dump store: the only egress is `dump`, `show`, the new `search`, and
`clauses-for-chunk`. `docs/evidence-engine.md` — the architecture doc — does not
mention it at all.

That is the largest gap between what the system *is* and what it is *for*. The
authoring investment only pays if the argument graph can be queried at drafting
time; today it can be grepped as JSONL. The 2026-08-06 addition of FTS search and
chunk reverse-lookup is the first step in the right direction and should be read
as the beginning of the retrieval story, not the end of it. (Note also that
`archon-knowledge` carries a *parallel* auto-extracted `kb_claims` layer with no
declared relationship to `corpus_claims`.)

### 8.2 The prose half of new entries is close to vestigial

E2 requires an overview file and a `units/` directory. Eight of the ten v1.1
entries have an **empty** `units/` directory — the check passes on existence, not
content. The two exceptions inherited their unit files: FCM (45 files) and King &
Salvo (3). Compare a legacy entry such as *Design for Dasein*: per-unit `.md` +
`.json` + `-edges.csv` triples, `_synthesis/` ontologies, bridge-sources.

So the format has *inverted* the legacy imbalance rather than resolving it.
Legacy = deep prose, unverifiable machine wiring. v1.1 = verified machine rows,
one overview page. The ledger records the structural consequence for legacy —
"the prose halves under `index/` never mention the machine ids (`grep -rl "phf-"
index/` is empty): the two halves are structurally disjoint" — and nothing in
v1.1 yet forces the new halves to reference each other either. The manifest binds
them administratively; no check binds them semantically.

### 8.3 Half the declared vocabulary describes nothing

`index/vocab/` holds eight files. E9 checks three fields — `claim_kind`,
`relation`, `rights_tier` — and only ever **WARNs**. The other vocabularies are
read by no program, and two of them have drifted completely out of contact with
the data:

| vocab file | declares | actually written |
|---|---|---|
| `stances.txt` | asserts, concedes, concludes, contests, qualifies, refutes, reports | reporting (207), critical (18), asserting (17), adopting (4), conceding (2), advancing (1) |
| `support-tiers.txt` | T1 … T8 | strong (223), moderate (24), weak (2) |
| `entry-profiles.txt`, `group-kinds.txt` | — | unchecked |

Zero of the six stance values written match the seven declared forms. `author-entry.py`'s
defaults (`stance: "asserting"`, `support: "moderate"`) are themselves
out-of-vocabulary. Nothing fails, nothing warns, and the format doc's claim that
`support_tier` is a controlled field is currently untrue. Either the files or the
defaults should move; the cheap fix is to extend E9 over `stance` and
`support_tier` and let it report the drift once.

### 8.4 The `grp-` id namespace is doubly booked

`AUTHORING-FORMAT.md` §2 reserves `grp-<purpose-slug>` for corpus-global **group
ids**, but three entries use `grp-…` as their **entry_id**. `check-entry.py`
works around the resulting ambiguity with a heuristic — a group belongs to the
entry if its `group_id` starts with `"<entry_id>:"` *or* the entry appears in
`entry_ids_json` — which happens to work because `author-entry.py` namespaces
suffix-form ids as `<entry_id>:<id>`. It is fragile: a genuinely corpus-global
`grp-x` group and an entry called `grp-x` would collide in E6's `known` set and
in every id-prefix regex in the scan (`walk_ids` matches `grp-` as a typed id).

### 8.5 Clause rows are thinner than the schema promises

An authored clause row writes 16 of 23 columns. Absent (defaulting to `-1`/`""`):
`span_start`, `span_end`, `sentence_index`, `line_start`, `line_end`,
`page_printed`, `quote_sha256`. Consequences:

- **Decision 1 — "the exact span is ALWAYS stored on CLAUSE rows" — is not honored** by the current authoring path. The format doc quietly concedes this ("advisory: no machine check reads them back"), but the schema header still states it as a design constraint.
- `offset_semantics: "utf8-byte"` is stamped on every row while there are no offsets for it to interpret — a semantic label for absent data.
- `quote_sha256` is empty, so the ingestion doc's claim that stranded anchors can be re-anchored mechanically "from stored quotes + hashes" holds only via the quote text.
- `page_printed` is unpopulated, so the printed-vs-PDF page problem has no machine support in the index.
- The seeded `bbox_json` is the *fragment* (chunk/block) box — e.g. `[318.0, 444.09, 555.03, 719.16]`, a column-sized region — not a quote-tight box, even though the sentence layer holds tight boxes at 98.39% coverage. The evidence layer is anchored at coarser granularity than the ingestion layer can support.

### 8.6 Verification sampling is deterministic and narrow

E8 spot-verifies **3** anchored clauses under `random.seed(11)`; D1 samples
**100** under `random.seed(42)`. Fixed seeds make runs reproducible — and also
mean re-running never widens coverage: the same three rows are re-checked
forever, and the other 389 v1.1 clauses are verified exactly once, at import. A
rotating seed (or a coverage ledger of which clause ids have ever been
re-verified) would convert a repeated check into an accumulating one.

### 8.7 Test coverage stops at the gate functions

There are 8 unit tests on the clause/source gates (fabricated quote, tiny quote,
foreign scheme, gate-dodge-by-omission, identity collision, duplicate work) and 4
on the schema/offsets — genuinely good adversarial tests. But there is **no
integration test** for `corpus-index import/validate/dump/remove`, none for the
quarantine round-trip, and the two Python gates (830 lines of definition-of-done)
have no automated tests at all; the handoff notes E3 and E11 were
"regression-tested" by hand. The scripts also silently swallow `archon`'s exit
status — `dump()` parses stdout and returns `[]` on failure, so a broken binary
would present as an entry with zero rows and E3 would report a count mismatch
rather than a tooling error.

### 8.8 Concurrency has no lock at the level that matters

Cozo writes are guarded (single-writer lock + retry), but the *entry* is not:
imports are last-writer-wins keyed upserts, and two sessions editing the same
spec, prose, and rows would silently interleave. The handoff makes this the
single BLOCKING item (§3.1) after another session offered to run the same fix.
The format has no ownership token, no `corpus_imports` pre-flight check beyond a
manual suggestion to "check for another session's imports during your working
window."

### 8.9 Every read path takes a write lock

`open_db()` calls `ensure_corpus_schema` on *every* subcommand, including
`status`, `dump`, `show`, and `search` — so nominally read-only inspection opens
the store mutably and acquires the guard. This is why the present analysis did
not query the store. It also means `check-entry.py`, which dumps **all** clauses
(8,553 rows) on every run to scope one entry, is both O(corpus) per entry check
and a writer. Both are cheap to fix (an immutable open path; a source- or
prefix-scoped clause query) and both will bite as the corpus grows.

### 8.10 Two FTS sanitizers, one stale comment

`corpus_index.rs::fts_safe` is a local copy justified by a comment saying
archon-docs' helper "still passes hyphens through (the known verify-quote parse
gap)". The most recent commit (`75d8c210`) fixed exactly that in
`retrieval_query::safe_fts_query`. The comment is now wrong and the duplication
is live: the docs sanitizer also strips a 36-word stopword list, the corpus-index
one does not, so the same query can behave differently across the two search
surfaces. The handoff's open item "FTS hyphen/punctuation parse gap" is likewise
superseded.

### 8.11 Smaller notes

- `corpus_terms` is empty (0 rows) despite schema, id convention, vocabulary, and a documented import-ordering rule that exists solely to serve it. The terms layer is designed but unused.
- E9, E12, E14 are WARN-only; an entry can pass with out-of-vocabulary kinds, spliced quotes, and 0% evidence coverage. E14's 90% threshold is exactly what caught FCM at 2%, so the WARN tier is doing real work — but a WARN that never becomes a FAIL depends on a human reading it.
- `check-entry.py`'s docstring says legacy entries "fail E1/E5 by construction — do not run it on them." There is no guard enforcing that; running it on a legacy folder produces a confusing FAIL rather than a "not applicable."
- The quote gate's 4-word floor is measured on *whitespace-split* tokens of the verified text, so a 3-word Greek phrase cannot be anchored at all — reasonable, but it is a real constraint on lemma-level evidence in a corpus full of Greek and German technical terms.
- `index/compiled-index.json` (629 KB: 701 ontology nodes, 1,722 canonical terms, 64 tension edges) is a *separate*, older concept-ontology artifact built by a script that lives in the other repo (`scripts/compile-corpus-index.py`), last built 2026-07-29. It is not produced or consumed by anything in archon-cli-v3 and is now stale relative to the ten new entries.

---

## 9. What the design gets right

Worth stating plainly, because the finding list above is longer than the praise
list and that ordering is misleading about quality:

1. **Born-verified is the correct invariant.** The 145-row stale sweep of 2026-08 is the empirical case for it, and the gates make that class of rot structurally unrepeatable. `import --dry-run` plus `author-entry --check` means an author can rehearse the whole pipeline without touching the store.
2. **Every adversarial finding became a gate.** The source-identity guard, the anchoring-guard converse, the foreign-scheme rejection, the ellipsis rule, E13's orphan check — each traces to a specific real failure (two Elpidorou-2018 papers; unverified quotes in cited-only camouflage; `phf-fcm-0573`; the 420-instance A-01 splice class). The gate inventory reads like a scar map, which is the sign of a protocol that was actually used.
3. **The failures are documented in the artifacts, not hidden.** The legacy ledger quantifies its own 42% orphan rate and explains why the cheap fix (batch re-anchor) is invalid. The census-in-a-file design anticipates that a healthy corpus moves. `check-entry` prints which binary it used because of a known stale-binary footgun.
4. **The style-lock reasoning is exemplary.** Refusing morphological patterns because false positives get a check waived; excluding the clause table wholesale rather than blacklisting quote fields; failing on unused exceptions. That is someone designing against the *human* failure mode, not just the machine one.
5. **Group entries and tensions are real modeling contributions.** Making "cited collectively but inert" a first-class record, with a promotion rule, is a better answer than either ignoring those sources or inflating them into full entries.

---

## 10. If I were to prioritize the next work

1. **Give the index a reader.** A query surface that answers "what evidence supports claim X", "what contests it", "traverse this tension" — exposed to whatever does the drafting. Without it the 35,600 rows are a filing cabinet.
2. **Close the vocabulary gap** (§8.3) — extend E9 to `stance`/`support_tier` and reconcile the files with `author-entry.py`'s defaults. One commit, removes a live untruth from the format doc.
3. **Decide what the prose half is for** (§8.2). Either require non-empty `units/` with a per-unit↔claim binding, or drop `units/` from E2 and say the overview is the prose half. The current state passes a check that measures nothing.
4. **Make clause rows carry what the schema promises** (§8.5) — at minimum `quote_sha256` and `page_printed`; ideally sentence-tight bboxes from the sentence layer, which already exist at 98.39% coverage.
5. **Rotate verification sampling** (§8.6) and add an integration test for the import/quarantine round-trip (§8.7).
6. **Add an entry-level ownership marker** before two sessions author concurrently again (§8.8).

---

*Sources read: `index/AUTHORING-FORMAT.md`, `index/INDEX-OWNERSHIP.md`,
`docs/ingestion-and-corpus-index.md`, `docs/evidence-engine.md`,
`crates/archon-knowledge/src/corpus.rs`, `src/command/corpus_index.rs`,
`src/command/corpus_index_verify.rs`, `src/cli_args/data_actions.rs`,
`crates/archon-docs/src/quote_verify.rs`, `crates/archon-docs/src/retrieval_query.rs`,
`scripts/author-entry.py`, `scripts/check-entry.py`, `scripts/verify-corpus.sh`,
`scripts/phase7_verification_scan.py`, `reports/HANDOFF-INDEX-AUTHORING-2026-08-06.md`,
`reports/verification-scan-2026-08-06.md`, `reports/legacy-index-ledger-2026-08-06.md`,
`index/vocab/*`, ten `entry-spec.json` + `manifest.json` pairs, and the
generated intermediates under `.archon/corpus-import/`.*
