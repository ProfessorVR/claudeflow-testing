# 03 — Open questions requiring the author before execution

> **RULINGS RECEIVED 2026-07-29 (verbatim: "1) A. 2) A 3) A"):**
> **Decision 1 = (a)** — the rights-tiered storage/display split replaces the blanket
> 25-word ban: store the exact span always with `rights_tier` + `redact_on_render`;
> word ceilings apply to RENDERED output only. **Phase C1 is unblocked.**
> **Decision 2 = (a)** — the density band is confirmed at 15–35 records per 1,000
> source words (by profile). **Phase D1 threshold basis is set.**
> **Decision 3 = (a)** — debates, the intra-cluster citation network and the
> scholarly-evolution arc move to the optional GROUP layer with
> `N/A-by-construction` semantics; single-article entries pass on the remaining
> entry-level gates. **Phase D1 is unblocked.**
> §2's N1–N5 remain open except as noted inline.

Two sections. §1 is the three decisions carried forward from the draft plan's HANDOFF block — unchanged in substance, kept with the phase each blocks. §2 is what this finalizing session adds. Nothing else blocks execution: Phases 0, A and B are fully executable with no decision at all.

**Settled and NOT raised here:** the wraith-infer / reranker question (settled by the retirement directive; the reranker eval win is an accepted loss); target repository (archon-cli); index-before-ingestion; regeneration sanction; transfer-before-work; sandbox promotion, authoritative store, compiler disposition, migrate-vs-re-author (all settled at draft §13); the draft's §13.4 duplicate-copies housekeeping (already done — the `plans/` root copies were deleted before this session, verified).

---

## §1 — Carried forward from the HANDOFF block (the three blocking decisions)

### Decision 1 — Verbatim storage · **blocks Phase C1**

Does a rights-tiered storage/display split replace the blanket 25-word quotation ban — store the exact span always, with `rights_tier` (`own-work | public-domain | licensed | third-party-copyright`) and `redact_on_render`, applying word ceilings only to rendered output?

- **Why it blocks:** `rights_tier` and `redact_on_render` are columns in the CLAUSE relation; Cozo has no `ALTER`, so the column set is a redo cost. A clause-level index needs the clause, and a verbatim checker needs a stored span to compare against. The ban is currently applied uniformly to Aristotle, Radcliffe 1794, Equiano 1789 and your own MA thesis; two entries deliberately suppress verbatim text under it (and A-52's 31 over-limit Grammar quotations / A-41's false FCM gate show it is neither obeyed nor checkable as prose).
- **Options:** (a) adopt the split as specified in draft §3.1 — **recommended**, it is what makes C8's machine verification and the CLAUSE record coherent; (b) keep the blanket ban and accept that CLAUSE records for third-party sources store hashes + addresses only (weakens the verbatim checker to hash-equality; still workable but B4's corruption diagnosis loses most of its power); (c) split by rights tier but with a stored-span word cap for `third-party-copyright` (a middle position; complicates the checker for marginal legal comfort on a private store).

### Decision 2 — Density band · **blocks Phase D1**

Confirm 15–35 records per 1,000 source words as the density gate band (by profile).

- **Why it blocks:** every D1 gate threshold derives from it, and it implies roughly 50–500 claims per article against today's ~7. Calibration: your own two exemplars sit at 1 record / 58 words (`Dissertation/`) and 1 / 59 (`Veri(dis)similitude`) versus the audited ~1 / 1,218 (Boredom Secondary); the sandbox extraction ran 155–512 claims/article.
- **Options:** (a) confirm 15–35 — **recommended** (both exemplars fall inside it at ~17/1,000); (b) set a lower floor (e.g. 8–35) if you want early entries to pass while extraction quality ramps — the gate is an expression over a config value, so raising it later is cheap; (c) per-profile bands only, no global band.

### Decision 3 — Group layer · **blocks Phase D1**

Confirm that documented debates, the intra-cluster citation network, and the scholarly-evolution arc move to an optional GROUP layer reporting `N/A-by-construction`, so a single-article entry can pass its gates.

- **Why it blocks:** these are the only three gates that genuinely collapse at N=1 (verified against the gold cluster: 12/12 Phantasia and 11/11 Boredom debate axes are multi-unit). Moving them is what makes the standing ruling that articles get standalone entries executable; the concordance, contested readings, concept extraction and the edge floor stay at entry level.
- **Options:** (a) confirm — **recommended**; (b) keep them entry-level and exempt single-source profiles by rule (equivalent effect, messier gate logic).

---

## §2 — New questions from this session (clearly separated from the carried set)

### N1 — Off-machine preservation destination · **blocks P0.5 (nothing else)**

P0.5 specifies a git bundle + checksummed copy to the MacBook Air (`daltonsalvo@192.168.50.10`) as cold storage. Your standing rules require asking before anything push-like, so: confirm the Mac as the destination, or name another (external drive; a private GitHub remote — which would also be the first push of `feat/wraith-retrieval` anywhere).

- **Recommendation:** Mac cold-storage now (it is not a code sync and doesn't violate the WSL-verified-working rule), plus a private remote push later under N2. If the Mac is unreachable, any second physical medium; Phase 0 must not complete with zero off-machine copies.

### N2 — Archon's 186 unpushed commits and dead CI · **blocks nothing before Phase C; blocks trusting C–F**

Workflow D's standing conditions on the schema work: archon HEAD `8758f2fa` is contained by **no remote** (the entire archon-evidence crate exists only on this WSL box), and CI triggers only on `main`, frozen since 2026-06-13, with the blocking `cargo fmt` gate red. Phases C–D add a 14-relation subsystem on top of that pile.

- **Question:** authorize (a) pushing archon `feat/wraith-retrieval` (after A5's wraith removal lands) to a private remote, and (b) pointing CI at the working branch (or merging to `main`)?
- **Recommendation:** yes to both, sequenced right after Gate G-A — with the push happening only after the wraith-removal commit so no wraith endpoint ever lands on a remote. Note the DO-NOT-TOUCH list keeps CI *workflow definitions* out of scope until you answer this; a yes converts it into a small named step.

### N3 — Purge the index-derived records already in the incumbent corpus store? · **blocks nothing; affects interim drafting quality**

A1 stops *future* re-embedding of `corpus/index` into the corpus, but ~518–522 index-derived manifest records (and their ChromaDB vectors) are already in the store — index prose is being retrieved as if it were corpus text during interim drafting.

- **Question:** purge them now (backup first; delete by `path_rel` prefix under `corpus/index/`), or leave until Phase F's re-ingest naturally rebuilds the store?
- **Recommendation:** purge now — it is cheap, backed up, and removes a retrieval contaminant from every interim drafting run. If you say yes, it becomes step A1b with a before/after count gate.

### N4 — Which entry is the D5 pilot? · **blocks D5 only**

D5 authors one entry end-to-end under the locked system "from the citation-priority queue." Name it (or confirm the executor should take the top of the queue at execution time).

- **Recommendation:** pick a single-source ARTICLE-profile entry that Part III cites soon — it exercises the Decision-3 GROUP semantics and the full gate suite at minimum cost.

### N5 — This archive's growing size in git · **housekeeping, non-blocking**

P0.4 commits `plans/index-overhaul-2026-07-29/` (~39 MB incl. raw journals) to the working branch for preservation. If repo weight matters to you, say where you want it long-term (stay in-branch; an artifacts branch; or out-of-repo archive after Phase F). Default if you say nothing: it stays in-branch.
