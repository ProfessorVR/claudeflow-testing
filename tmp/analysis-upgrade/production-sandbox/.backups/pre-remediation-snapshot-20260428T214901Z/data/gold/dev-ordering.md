# Dev Annotation Ordering — Locked Sequence

**Status:** Locked 2026-04-28 (Unit B step 4 of dev-annotation execution plan).
**Predecessor:** holdout 20/20 complete and validator-clean as of 2026-04-27.
**Generator:** `scripts/compute-dev-ordering.py` (commit-tracked; deterministic given seed + candidate-pool state).

---

## Seed and rationale

**Seed:** `20260422`

**Rationale:** date-encoded as `YYYYMMDD` for the date the annotation discipline was established (item-1 of holdout annotation). Encoding the discipline-establishment date into the seed makes the seed self-documenting: future readers can recover the seed's provenance from the seed value itself.

**Three-sentence rationale (locked at plan-critique Decision 3):**
1. Pure stratified-random within genres (Option A) selects 50 dev items from the 145-item filtered candidate pool with no front-loading by evidence-richness, defending against selection bias on item-25 deferred-decision evidence accumulation.
2. The seed `20260422` is the date-encoding of when the annotation discipline was established (holdout item-1, 2026-04-22), making the seed value itself a pointer to the discipline's origin.
3. The pre-computed sequence below is committed before the first dev annotation, locking the order against silent reordering and providing a reproducibility anchor: re-running `compute-dev-ordering.py` must yield the same sequence (verified via sha256 of the canonical sequence payload).

---

## Stratification

Per `data/gold/README.md` §3 distribution table:

| Genre | Selection | Raw pool | Filtered pool | Selection ratio |
|---|---|---|---|---|
| `primary_aristotle` | 15 | 45 | 41 | 15 / 41 (≈ 36.6%) |
| `primary_heidegger` | 10 | 30 | 29 | 10 / 29 (≈ 34.5%) |
| `secondary_non_phantasia` | 10 | 30 | 30 | 10 / 30 (≈ 33.3%) |
| `secondary_phantasia` | 15 | 45 | 45 | 15 / 45 (≈ 33.3%) |
| **Total** | **50** | **150** | **145** | |

---

## Procedure (locked, reproducible)

1. **Seed RNG** to `20260422`.
2. **Load holdout** claim_id set from `data/gold/resolver-gold-holdout.jsonl` (20 ids).
3. **For each genre** (in alphabetical order — locked: `primary_aristotle` → `primary_heidegger` → `secondary_non_phantasia` → `secondary_phantasia`):
   - Load candidates from `data/gold/candidates/dev-{genre}.sample.jsonl`.
   - Sort candidates by `claim_id` (deterministic input ordering).
   - Filter out any `claim_id` present in the holdout set.
   - `random.sample` N items from the filtered pool.
4. **Combine** all 50 selected items into a single list.
5. **`random.shuffle`** the combined list to produce the dev annotation order.

The genre-iteration order is **locked**: changing it changes the RNG call sequence and the output sequence. The candidate-list internal ordering is sorted ascending by `claim_id` before sampling, so candidate-file line order is irrelevant.

**Lock-against-silent-change provision (per Decision 3):** the seed is not to be changed mid-stream. If reproducibility breaks (candidate file modified, holdout file modified, etc.), document the reason and use a new seed as an addendum below; do not silently re-run.

---

## Holdout-exclusion finding (2026-04-28; first-run procedural finding)

On first run of `compute-dev-ordering.py` (without exclusion filter), 5 holdout claim_ids were found in the dev candidate sample files:

| File | Overlapping claim_ids |
|---|---|
| `dev-primary_aristotle.sample.jsonl` | `claim-aristotle-da-3.3-033`, `claim-aristotle-da-3.3-037`, `claim-aristotle-da-3.3-053`, `claim-aristotle-da-3.3-058` |
| `dev-primary_heidegger.sample.jsonl` | `claim-heidegger-bcap-036` |
| `dev-secondary_non_phantasia.sample.jsonl` | (none) |
| `dev-secondary_phantasia.sample.jsonl` | (none) |

**Cause (resolved via pre-Unit-C diagnostic 2026-04-28):** all 5 contaminated items appear in BOTH the `dev-*` AND `holdout-*` candidate sample files. The candidate sampler (`scripts/sample-gold-candidates.py`) did not enforce dev/holdout pool disjointness at sampling time. Timing alone (candidate files 2026-04-21 mtime; final holdout 2026-04-27 mtime) was a contributing condition but not the root cause — the holdout *candidate pool* was sampled at the same time as the dev *candidate pool*, and the sampler allowed shared items between them.

**Broader pool overlap:** full holdout-pool ↔ dev-pool intersection is **15 items**, not just the 5 that ended up in final holdout. The other 10 are "almost-holdout-but-not-selected" candidates — they are in both candidate pools but were not chosen during holdout finalization. They remain in the dev candidate pool and are **legitimately eligible** for dev sampling since they are not in final holdout. The final-holdout exclusion filter (not the broader pool-intersection filter) is the right semantic.

**Pre-Unit-C diagnostic results (other contamination dimensions):**
| Diagnostic | Result |
|---|---|
| Cross-genre overlap WITHIN dev pool (same claim_id in multiple `dev-*` files) | 0 |
| Cross-genre overlap WITHIN holdout pool (same claim_id in multiple `holdout-*` files) | 0 |
| Internal duplicates within any single candidate file | 0 |
| Final holdout ⊆ candidate holdout pool (no out-of-pool items in final) | ✓ (0 missing) |

Localized failure: only the dev/holdout boundary was affected. Broader cleanup not required.

**Fix:** the exclusion filter is applied at ordering-computation time inside `compute-dev-ordering.py` (step 3 of procedure). The candidate files themselves are not modified — leaving them as the original sampled-pool record while the filter operates downstream. This preserves the candidate-sampling provenance and keeps the 10 "almost-holdout-but-not-selected" items available for dev sampling.

**Effect on pool sizes:** primary_aristotle 45→41 (4 final-holdout items excluded); primary_heidegger 30→29 (1 final-holdout item excluded); others unchanged. Total candidate pool 150→145. Sampling 50 of 145 remains comfortably feasible.

**Disjointness verified post-fix:** dev sequence ∩ final holdout = ∅ (overlap count = 0).

**Forward defense:** any future holdout extension or candidate re-sampling must re-run the exclusion filter against the updated final holdout and re-verify post-fix disjointness. The lock-against-silent-change provision in the addenda section below is the governance hook.

**Forward note (upstream-vs-downstream):** the sampler defect persists at `scripts/sample-gold-candidates.py`. The downstream exclusion filter inside `compute-dev-ordering.py` is sufficient for THIS corpus generation but any future re-sampling will reproduce the contamination unless the sampler is patched. **Pre-condition for any re-sampling work:** patch sampler to enforce pool disjointness (`dev-pool ∩ holdout-pool = ∅` at sampling time) before re-running. Do not trust the downstream filter as a complete fix — it is a contamination-tolerant downstream control, not a contamination-prevention upstream fix.

**Item-25 codification candidate:** sampler-level disjointness enforcement (corpus-data-quality §3 sub-section) — see drift-log entry `2026-04-28 | observation — dev-holdout-contamination`.

---

## Pre-computed sequence (50 items, locked)

**SHA-256 of canonical sequence payload:** `caf8a8b8ae1f7d691e228d003b58ad958f84d55c50e958359b9ccd2e7e3e2498`

Verification command:
```bash
python3 scripts/compute-dev-ordering.py | python3 -c "
import json, sys, hashlib
raw = sys.stdin.read()
data = json.loads(raw[:raw.find('# sequence-sha256:')].strip())
canonical = json.dumps(data['sequence'], sort_keys=True).encode()
print(hashlib.sha256(canonical).hexdigest())
"
# Expected: caf8a8b8ae1f7d691e228d003b58ad958f84d55c50e958359b9ccd2e7e3e2498
```

| #  | claim_id | genre |
|----|----------|-------|
|  1 | `claim-papachristou-2013-198` | secondary_phantasia |
|  2 | `claim-aristotle-da-3.3-074` | primary_aristotle |
|  3 | `claim-oconnor-wong-2005-056` | secondary_non_phantasia |
|  4 | `claim-fodor-1974-021` | secondary_non_phantasia |
|  5 | `claim-heidegger-bcap-067` | primary_heidegger |
|  6 | `claim-aristotle-da-3.3-050` | primary_aristotle |
|  7 | `claim-heidegger-bcap-012` | primary_heidegger |
|  8 | `claim-heidegger-bcap-105` | primary_heidegger |
|  9 | `claim-frede-1992-047` | secondary_phantasia |
| 10 | `claim-aristotle-da-3.3-034` | primary_aristotle |
| 11 | `claim-heidegger-bcap-082` | primary_heidegger |
| 12 | `claim-kim-1990-213` | secondary_non_phantasia |
| 13 | `claim-aristotle-da-3.3-051` | primary_aristotle |
| 14 | `claim-frede-1992-030` | secondary_phantasia |
| 15 | `claim-aristotle-da-3.3-028` | primary_aristotle |
| 16 | `claim-heidegger-bcap-094` | primary_heidegger |
| 17 | `claim-bowin-2017-129` | secondary_phantasia |
| 18 | `claim-chalmers-2016-218` | secondary_non_phantasia |
| 19 | `claim-nussbaum-1985-077` | secondary_phantasia |
| 20 | `claim-nussbaum-1985-061` | secondary_phantasia |
| 21 | `claim-aristotle-da-3.3-063` | primary_aristotle |
| 22 | `claim-horgan-1993-136` | secondary_non_phantasia |
| 23 | `claim-aristotle-da-3.3-036` | primary_aristotle |
| 24 | `claim-aristotle-da-3.3-066` | primary_aristotle |
| 25 | `claim-papachristou-2013-277` | secondary_phantasia |
| 26 | `claim-aristotle-da-3.3-077` | primary_aristotle |
| 27 | `claim-ogorman-2005-149` | secondary_phantasia |
| 28 | `claim-aristotle-da-3.3-062` | primary_aristotle |
| 29 | `claim-caston-1995-032` | secondary_phantasia |
| 30 | `claim-papachristou-2013-093` | secondary_phantasia |
| 31 | `claim-aristotle-da-3.3-020` | primary_aristotle |
| 32 | `claim-mcdonnell-wildman-2019-213` | secondary_non_phantasia |
| 33 | `claim-heidegger-bcap-054` | primary_heidegger |
| 34 | `claim-horgan-1993-146` | secondary_non_phantasia |
| 35 | `claim-horgan-1993-325` | secondary_non_phantasia |
| 36 | `claim-papachristou-2013-280` | secondary_phantasia |
| 37 | `claim-aristotle-da-3.3-060` | primary_aristotle |
| 38 | `claim-heidegger-bcap-028` | primary_heidegger |
| 39 | `claim-papachristou-2013-061` | secondary_phantasia |
| 40 | `claim-barnes-2012-214` | secondary_non_phantasia |
| 41 | `claim-nussbaum-1985-080` | secondary_phantasia |
| 42 | `claim-heidegger-bcap-044` | primary_heidegger |
| 43 | `claim-aristotle-da-3.3-026` | primary_aristotle |
| 44 | `claim-heidegger-bcap-059` | primary_heidegger |
| 45 | `claim-caston-1995-016` | secondary_phantasia |
| 46 | `claim-barnes-2012-272` | secondary_non_phantasia |
| 47 | `claim-aristotle-da-3.3-080` | primary_aristotle |
| 48 | `claim-heidegger-bcap-001` | primary_heidegger |
| 49 | `claim-aristotle-da-3.3-049` | primary_aristotle |
| 50 | `claim-ogorman-2005-004` | secondary_phantasia |

---

## Per-genre selection (alphabetical within genre, for at-a-glance verification)

### primary_aristotle (15 of 41 filtered)
- `claim-aristotle-da-3.3-020`, `-026`, `-028`, `-034`, `-036`, `-049`, `-050`, `-051`, `-060`, `-062`, `-063`, `-066`, `-074`, `-077`, `-080`

### primary_heidegger (10 of 29 filtered)
- `claim-heidegger-bcap-001`, `-012`, `-028`, `-044`, `-054`, `-059`, `-067`, `-082`, `-094`, `-105`

### secondary_non_phantasia (10 of 30)
- `claim-barnes-2012-214`, `-272`
- `claim-chalmers-2016-218`
- `claim-fodor-1974-021`
- `claim-horgan-1993-136`, `-146`, `-325`
- `claim-kim-1990-213`
- `claim-mcdonnell-wildman-2019-213`
- `claim-oconnor-wong-2005-056`

### secondary_phantasia (15 of 45)
- `claim-bowin-2017-129`
- `claim-caston-1995-016`, `-032`
- `claim-frede-1992-030`, `-047`
- `claim-nussbaum-1985-061`, `-077`, `-080`
- `claim-ogorman-2005-004`, `-149`
- `claim-papachristou-2013-061`, `-093`, `-198`, `-277`, `-280`

---

## Item-25 fire (overall item 45 = dev item 25)

Per locked execution plan Decision 8: at sequence position **25** (claim `claim-papachristou-2013-277`), after annotation completion, fire item-25 checkpoint with:
- **2 codifications** (load-bearing-modifier + slug-graveyard primary-vs-secondary)
- **5 deferred-with-explicit-trigger-conditions** carried forward (AF5 splitting, attribution-scope joint-eval, cross-author-concept-collision sub-modes, heidegger-technical-upgrade scope, surface-variant taxonomy with early-trigger)

Per locked plan Decision 8 also: interim check at **dev-5** (sequence position 5 — `claim-heidegger-bcap-067`) for evidence-accumulation scan; interim check at **dev-20** (sequence position 20 — `claim-nussbaum-1985-061`) for §8.0-style trigger scan.

---

## Holdout lock-discipline reference

The holdout file `data/gold/resolver-gold-holdout.jsonl` is **operationally locked** from this point forward (no edits during dev annotation).

**Lock anchor (recorded 2026-04-28, Unit B step 6b):**

| Property | Value |
|---|---|
| Path | `data/gold/resolver-gold-holdout.jsonl` |
| Lines | 20 |
| md5 | `2c6f1f7e76c7fc7192a5d4dfba515a59` |

**Tamper-detection check** (run before any dev-annotation session):
```bash
md5sum data/gold/resolver-gold-holdout.jsonl
# Expected: 2c6f1f7e76c7fc7192a5d4dfba515a59  data/gold/resolver-gold-holdout.jsonl
```

If the hash differs, the holdout has been modified — investigate before continuing dev annotation; do not silently re-anchor.

Per `data/gold/README.md` §1: holdout is formally LOCKED after E0 baseline measurement (Phase 5 entry); the operational lock here is the precursor.

---

## Addenda (lock-against-silent-change log)

*No addenda. If reproducibility breaks (candidate or holdout files modified), append entries here documenting the reason and any new seed; do not silently re-run.*
