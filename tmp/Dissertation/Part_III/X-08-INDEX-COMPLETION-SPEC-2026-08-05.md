# X-08 — Claim-level index completion spec (2026-08-05)

**Goal (author ruling 2026-08-05): every source the laboratory boredom section relies on is properly indexed at
the claim level, with synthesis and debate map regenerated to match.** Not a triage — full coverage.

**Scope discovered by audit, not assumed.** Three separate gaps, only one of which was previously known.

---

## 0. THE THREE LAYERS — do not conflate them

| layer | state | command surface |
|---|---|---|
| **Semantic / vector index** (chunks + embeddings) | **COMPLETE.** 241 docs, 13,564 chunks, 0 failed, queue empty. All four newly-flagged documents resolve under `verify-quote`. | `docs ingest` / `docs index` |
| **Claim-level corpus index** (`corpus_*` Cozo relations) | **INCOMPLETE — this spec.** 108 sources, 8,380 clauses, 6,304 claims, 20,817 edges, 119 tensions, 49 groups, 31 imports. | `corpus-index validate` / `import` — **consumes** an intermediate, does not generate one |
| **Markdown analytical tree** (`bor-sec-NN-*.md` + `_synthesis/`) | partial | **no CLI surface** — authored |

**The field-test finding: there is no generator.** `corpus-index` validates and imports JSONL intermediates
against a relation contract; `pipeline` offers only `code` and `research`; nothing under `docs`, `kb` or
`corpus-index` produces claims, clauses, edges or debate-axis groups. The generator is the agent-side analysis
pass. The import half is well built — per-kind contracts, `--dry-run`, and rejects quarantined to
`<file>.quarantine.jsonl` rather than dropped.

---

## 1. GAP A — ten EXISTING boredom units absent from the claim index

44 units carry per-document `.md` files; **42 `prose:bor:` sources exist; 10 are missing.** Two are directly
load-bearing for this section and were being drafted from without machine-index backing:

| # | unit | source | priority |
|---|---|---|---|
| 1 | `bor-sec-13` | Slaby, *The Other Side of Existence* (2010) | **HIGH — L1 ¶2**, the surface-over-depth reading |
| 2 | `bor-sec-25` | Elpidorou, *The Bored Mind is a Guiding Mind* (2018) | **HIGH — L1 ¶12**, DA-01 |
| 3 | `bor-sec-26` | Elpidorou, *The Good of Boredom* (2018) | **HIGH — L1 ¶12**, DA-01 |
| 4 | `bor-sec-03` | Elpidorou & Freeman, *Affectivity in Heidegger II* (2015) | medium |
| 5 | `bor-sec-05` | Elpidorou & Freeman, *Fear, Anxiety, and Boredom* (2020) | medium |
| 6 | `bor-sec-06` | Elpidorou, *Boredom as a Concept in Phenomenology* (2023) | medium |
| 7 | `bor-sec-40` | Jaques et al., *Predicting Affect from Gaze Data* (2014) | medium |
| 8 | `bor-sec-37` | *Review of Eye-Tracking Metrics* (Preprint v3) | low |
| 9 | `bor-sec-41` | Wang, Xu & Chen, *GazeMotive* (2019) | low |
| — | ~~`bor-sec-11`~~ | Hernández Albarracín et al. | **DROPPED — non-English (author ruling). Do not index.** |

**Retrieval hazard on `bor-sec-40`:** Jaques resolves under `Intelligent Tutoring Systems.pdf`, byte-identical to
the file the index names (md5 `d531a4d6…`).

## 2. GAP B — thirteen documents in the store with no entry at all

All confirmed present in the store, all absent from `corpus_sources`.

### 2.1 Individual entries — five

| # | document | why individual, not grouped |
|---|---|---|
| 1 | **King & Salvo (2023), *Physiological assessment of learning in VR clinical immersion*** | **★ THE HIGHEST-VALUE MISSING ENTRY.** This is P1, whose adopted-definition sentence and stimulus rationale are quoted verbatim and carry the section's entire spine. P2 (2024) *is* indexed as `vle-eyetracking-2024`; the index currently holds the study the section critiques methodologically but not the one it argues from. |
| 2 | **Eastwood et al. (2012), *The Unengaged Mind*** | the environmental-attribution condition. The incompatibility with the FCM second form is located precisely in his third condition and **must exist as a `corpus_tensions` record**, not only as prose. |
| 3 | **Fahlman et al. (2013), *MSBS*** | the definition P1 adopted; the middle term of Eastwood → Fahlman → P1. |
| 4 | **van den Brink et al. (2016), *Pupil Diameter Tracks Lapses of Attention*** | D-18. Pupil as an index of attention and load rather than boredom-as-reported — the anchor that turns L3.4's pupil null into an answer. |
| 5 | **Mugon et al. (2020), *Boredom Proneness and Self-Control*** | own entry, but **joined to the existing DA-01 regulatory-account group** with `bor-sec-25`/`26` rather than seeding a new axis. |

### 2.2 Group entries — three

**Group A — "VR phenomenology cited as framing."** Morie (2008) · Heinzel & Heinzel (2010) · Tham et al. (2018).
Their role in L1 ¶8 is collective and identical: the 2023 paper cites all three as framing rather than as an
interpretive frame for its own data. The claim is about the set; no member is quoted individually. One group,
three source rows, a shared claim set, one edge to P1.

**Group B — "the program's own published lineage."** P2 (2024, already indexed — join it) · *Phenomenological
Evaluation of an Undergraduate Clinical…* · *Scalable Virtual Reality Global Clinical Immersion* (ASEE 2025).
L1 ¶8 argues about where the program stood **as a body of work**. **P1 stays outside this group** and keeps its
individual entry, because it is quoted rather than characterized.

**Group C — "method references."** Parhi & Ayinala (2014, Welch's method — `RE-PIN` the year, cited 2013 against
a January 2014 issue) · VanderWerf et al. (2003, blink duration, **after ingest — see §3**). Source rows and
citation edges; **no claims or tensions**, so they stay out of the argumentative graph while remaining
resolvable.

**Group D — VLE / pedagogy media-comparison.** Meyer, Omdahl & Makransky (2019) · Tamim et al. (2011). These
belong to the **desktop section's VR-pedagogy cluster**, not this one. Index them there, under that cluster's
prefix, so the boredom cluster's debate map is not polluted with media-comparison axes it does not argue.

## 3. GAP C — one document not in the store at all

**VanderWerf et al. (2003), *J Neurophysiol* 89(5):2784–96, doi:10.1152/jn.00557.2002.** The source for
spontaneous blink duration 334 ± 67 ms, which licenses the **500 ms blink ceiling** in METHODS §3.2 — a
load-bearing methodological citation with no document behind it. **Must be ingested before it can be indexed.**

```bash
cd /home/dalton/projects/archon-cli-v3
./target/release/archon docs ingest /path/to/VanderWerf-2003.pdf
./target/release/archon docs index-status        # wait for queue to drain
./target/release/archon docs list | grep -i vanderwerf
```

---

## 4. SYNTHESIS AND DEBATE MAP — what must be regenerated

Adding sources without regenerating these leaves the cluster internally inconsistent, which is the defect this
pass exists to remove.

| artifact | change |
|---|---|
| `_synthesis/manifest.json` | unit records, strand counts, `totalAnalyticalUnits`; new strand-C and strand-E members |
| `_synthesis/debate-map.{md,json}` | **★ the new axis: Eastwood/Fahlman's environmental-attribution condition ↔ the FCM second form's "nothing at all to be found."** This is the section's central tension and it currently exists nowhere in the machine index. Also: Mugon onto DA-01. |
| `boredom-construct-measure-concordance.{md,json}` | §2 and §7 — Eastwood/Fahlman populate the *definition* column the concordance's "hole" argument (L1 ¶10) depends on; van den Brink populates pupil-as-attention |
| `citation-network.{md,json}` | §2 — the Eastwood → Fahlman → P1 lineage as explicit edges; Group A's three-into-P1 framing edges |
| `cluster-ontology.{md,json}`, `global-edges.csv`, `concept-matrix.csv` | regenerate to match |
| `boredom-scholarly-evolution.md` | the 2012→2013→2023 definitional adoption arc |

**The debate-map axis in Gap B row 2 is the single most valuable output of this whole pass.** The section's
argument is that the published studies could only ever have detected the first form because their operative
definition builds the first form's structure into the construct. That is a *tension between two indexed sources*
and it should be queryable as one.

## 5. IMPORT SEQUENCE

Dependency order matters — sources before anything that references them.

```bash
cd /home/dalton/projects/archon-cli-v3
A=./target/release/archon

# inspect the contract for each kind before authoring
$A corpus-index dump sources | head -1 | python3 -m json.tool
$A corpus-index dump groups  | head -1 | python3 -m json.tool

for KIND in sources clauses claims edges tensions groups; do
  $A corpus-index validate $KIND  /path/to/$KIND.jsonl
  $A corpus-index import   $KIND  /path/to/$KIND.jsonl --dry-run
done
# then, same order, without --dry-run
$A corpus-index status          # confirm row deltas against the pre-run baseline
wc -l /path/to/*.quarantine.jsonl 2>/dev/null   # must be empty
```

**Pre-run baseline to diff against:** sources 108 · clauses 8,380 · claims 6,304 · edges 20,817 · tensions 119 ·
groups 49 · imports 31.

## 6. ORDER OF WORK

1. Ingest VanderWerf (§3) — nothing else can proceed for it.
2. **P1 (2023)** — unblocks the spine.
3. **Eastwood** + **Fahlman**, **with the tension record** (§4).
4. **van den Brink**; **Mugon** onto DA-01.
5. The three HIGH existing units — `bor-sec-13`, `25`, `26`.
6. Group A, then Group B.
7. The six medium/low existing units.
8. Group C; Group D into the pedagogy cluster.
9. Regenerate every artifact in §4; re-run §5's status diff.

## 7. OWNERSHIP — UNRESOLVED, decide before writing

`index/INDEX-OWNERSHIP.md` (2026-07-29) names **`claudeflow-testing/corpus/index`** the authoring home and the
other tree a read replica, one-way sync only. Its stated replica is `archon-cli/index/` — the **retired**
project — so it predates v3 and does not describe the current three-tree reality. The trees have diverged and
**v3 is the stale one**: it still carries the `Dissertation` entry (with `_living/` and `_run-history/`) that was
deleted by author order. More entries did not mean newer.

**The author has indicated that once v3 is finalized it becomes the de facto working index.** If this pass is
executed directly in v3, that transition is effectively happening — in which case `INDEX-OWNERSHIP.md` must be
updated **in both trees with the date**, per its own rule 3, and the stale `Dissertation` entry dropped from v3
so the trees agree.
