# §12 — Post-repair staleness sweep (the G19 gate, run by hand)

*Appendix to `00-SESSION-LOG.md`. Read-only; nothing was modified.*

Run 2026-07-29 after the anchor repair recorded in §11. This is requirement **G19** of the creation plan — *"after any entry is created or changed, grep the whole index for assertions about its prior state and fail on any hit"* — executed manually to see what a machine check would have caught.

**Result: the repair left 10 files carrying superseded assertions. Three were found by memory. Seven were not, and one of them reaches the runtime artifact.**

---

## 12.1 Inside the repaired entry — 4 sites the repair did not reach

The repair corrected the O-10 **gate** statements. These four are descriptive mentions in other registers and still say the use is pending.

| Site | Text | Note |
|---|---|---|
| `Boredom Experiment/_synthesis/book-level-ontology.md:51` | the `ch-selfreport` §3A node definition | **This is the file the compiler reads, and the stale text reaches `compiled-index.json`** — verified: the runtime node `ch-selfreport — per-video self-report channel` carries `pending O-10` |
| `Boredom Experiment/_synthesis/book-level-ontology.md:12` | "faithful-empirical unpublished raw record (per-video self-reports; dissertation use pending **O-10** consent-s…" | preamble, above §3A |
| `Boredom Experiment/units/bex-01-selfreport-record.md:3` | "**Register:** FE-U (unpublished raw record; dissertation use pending **O-10**)" | listed in §11 as deliberately untouched; it is the register line, and O-10 is now resolved |
| `Boredom Experiment/_synthesis/manifest.json:14` | `"raw_dataset": "… FE-U register pending O-10. …"` | the `raw_dataset` descriptor, distinct from the `gates` block that was corrected |

The first of these is the one that matters most: **the entry was repaired, recompiled, and a superseded consent-scope claim still reached the runtime artifact.** No check exists that would have said so.

## 12.2 Outside the entry — 6 files, of which 3 were not on the known list

### Known (recorded in §11)

**`Heidegger - FCM/_synthesis/fcm-king-salvo-bridge.md`** — 5 distinct sites on the superseded two-instrument reading:

| Line | Text |
|---|---|
| 42 | `## 4. Keystone — the cross-instrument contradiction *is* the second form (PROJECTED)` |
| 44 | "The apparent contradiction in §1 — **2023 EEG says the clinical video is boring-like; 2024 gaze says it is engaging-like**…" |
| 77 | `\| Clinical EEG ≈ boring \| FAITHFUL-EMPIRICAL \| 2023; *suggestive only* (N=1 clean) \|` |
| 81 | `\| The EEG/gaze contradiction = a second-form surface/depth split \| PROJECTED \| **keystone**; testable via §7.1 \|` |
| 84 | "**Lean-on / hold-back.** … Hold back: the 2023 EEG (treat as corroborating, not load-bearing)…" |

Line 84 is stale in the *opposite* direction from the rest: it instructs the drafter to hold back an EEG channel that is now processed at full N=8.

**`VLE/units/vle-02-boredom-raw-dataset.md:3`** — three superseded assertions in one line: the `(Med)` marker "meaning unconfirmed → O-10"; "any `.mat` processing DEFERRED (O-9)"; and "**FE-U use in the dissertation pending O-10 consent-scope confirmation.**"

**`Boredom Secondary/_synthesis/boredom-construct-measure-concordance.md`** — `****** UNVERIFIED` occurs **14 times**, not twelve. Worth re-checking which two are additional to the known channel pointers.

### Not previously identified

| Site | Text | Why it is stale |
|---|---|---|
| `VLE/_synthesis/book-level-ontology.md:3` | "FE-U = faithful-empirical unpublished raw record, **use pending O-10**" | Defines the provenance register for the whole entry — and this is a compiler-read file |
| `VLE/units/vle-00-corpus-overview.md:9` | "FE-U (unpublished raw record) use pending O-10 consent-scope confirmation" **and** "Corroborating only: P1 EEG (N=1-clean)" | Two assertions: the consent gate, and the EEG's status |
| `VLE/_synthesis/manifest.json:15` | `"raw_dataset": "… FE-U register pending O-10"` | machine-readable field |
| `FCM/bridge-sources/king-salvo-physiological-digest.md:23` | "**Reliability caveat:** EEG here is N=1-clean; the bridge must lean on the self-report + the larger 2024 gaze dataset, treating 2023 EEG as corroborating only." | The canonical physiological digest. Directs the drafter away from a channel now processed at N=8 |

`FCM/_synthesis/fcm-bibliography.md:129` also matched, but it is a bibliography entry for the 2023 pilot and is presumably correct as-is — flagged, not asserted.

---

## 12.3 What this establishes

Ten files. Three found by memory, seven by a grep that took under a minute. One of the seven had already passed through a recompile into the runtime artifact.

This is the same defect class the audit found independently: a superseded VLE figure that had propagated into **10 live locations in a sibling entry** plus 4 `global-edges.csv` rows. Two unrelated facts, the same failure, in the same index, found by two different methods.

It settles two open items in the creation plan and turns them from reasonable-sounding requirements into measured ones:

- **E10 (reverse-reference index, transactional correction).** A record-id → citing-files map, built at compile time, would have produced this list automatically and blocked the recompile until each site was resolved or waived.
- **G19 (post-change consistency sweep as a gate).** The sweep is cheap. The cost of not having it is that a corrected fact and its superseded twin coexist in the runtime artifact, and only the author's memory distinguishes them.

It also adds a specific requirement neither had: **a gate must re-read the compiled artifact after recompiling and assert that no superseded assertion survived.** The `ch-selfreport` case passed every check the system currently has — the entry was edited, backed up, recompiled, and verified as "clean and additive: 701 nodes, 1,722 canonical terms, 64 tension edges, no loss on any axis" — and the stale claim still shipped, because *no loss on any axis* is not the same as *no falsehood on any axis*.

---

## 12.4 Suggested repair order

Nothing here has been changed. If wanted, the order that minimises re-work:

1. `Boredom Experiment/_synthesis/book-level-ontology.md:51` and `:12` — the runtime-reachable ones. Recompile after.
2. `Boredom Experiment/units/bex-01-selfreport-record.md:3` and `_synthesis/manifest.json:14` — same entry, same fact.
3. VLE: `_synthesis/book-level-ontology.md:3`, `units/vle-00-corpus-overview.md:9`, `units/vle-02-boredom-raw-dataset.md:3`, `_synthesis/manifest.json:15` — one consent-scope fact plus the EEG status, four sites.
4. FCM: `_synthesis/fcm-king-salvo-bridge.md` (5 sites) and `bridge-sources/king-salvo-physiological-digest.md:23` — this is the one awaiting a sequencing ruling, since it rewrites a keystone rather than a status.
5. `Boredom Secondary/_synthesis/boredom-construct-measure-concordance.md` — the 14 `****** UNVERIFIED` markers, already queued as a separate pass.

Steps 1–3 are factual status corrections. Step 4 is an argumentative revision and should not be batched with them.
