# Grant-Writing Workflow — Start to Finish

A complete, copy-paste walkthrough for using this system to draft a grant proposal that (1) reads
in **your** trained writing voice, (2) follows the **structure, rigor, and rhetoric of your past
successful grants**, and (3) includes a **literature review grounded in real articles** with
verifiable quotes.

> **Read this once before starting.** Two things about how the system "learns" from your winning
> grants — they are genuinely different mechanisms, and knowing which is which will save you
> confusion:
>
> - **Linguistic style is *trained*.** `/god-learn-style` measures your successful grants and
>   builds a reusable **style profile** (sentence rhythm, voice, diction — the Lanham fingerprint).
>   This is a real, stored artifact the drafter targets.
> - **Structure / rigor / rhetoric is *captured as a blueprint*.** The system does not gradient-train
>   a "grant-shape model." Instead, you have the assistant read your winning grants once and distill
>   a reusable **Winning-Grant Blueprint** (section architecture, the rhetorical move each section
>   makes, how significance/innovation/rigor are established, evidence density, section lengths).
>   That blueprint — plus one or two full exemplar grants — goes into the drafting "pack" and steers
>   every new proposal. It's few-shot structural mimicry from your own winners, and it's how FCDP is
>   designed to work (the pack is authoritative; nothing is retrieved at draft time).
>
> Both come from the same folder of successful grants. Together they make new drafts *sound like you*
> and *be shaped like your winners*.

**The whole workflow at a glance:**

```
Phase 1  Collect successful grants ─┬─> Phase 2  Train linguistic style  (/god-learn-style)
                                    └─> Phase 3  Extract Winning-Grant Blueprint  (console analysis)
Phase 4  Add the NEW grant's solicitation + your project specifics
Phase 5  Add literature-review articles to corpus + ingest  (corpus-ingest.mjs)
Phase 6  Draft the proposal, section by section, with FCDP  (style + blueprint driven)
Phase 7  Draft the literature review with FCDP  (grounded in the ingested articles)
Phase 8  Assemble, run a whole-document consistency pass, finalize
```

Everything below runs inside `~/god-agent` in your Ubuntu/WSL terminal. If you haven't installed
the system yet, do that first (see `SETUP-WINDOWS-SOP.md`), then come back here.

---

## Phase 0 — One-time: make sure the system is up

```bash
cd ~/god-agent
source ~/.venv/bin/activate
./embedding-api/api-embed.sh start     # embedding server + ChromaDB (needed for the lit review)
npm run god-agent:start                # the four daemons
```

Confirm health (both should respond):

```bash
curl -s http://127.0.0.1:8000/health && echo
curl -s http://127.0.0.1:8001/api/v1/heartbeat && echo
```

Keep your grant materials out of version control. One time:

```bash
echo "grants/" >> .gitignore
```

---

## Phase 1 — Collect your successful grants

Make a folder and drop your funded proposals into it. **Use the full grant documents** — whole
proposals are ideal (far more than the ~500-word minimum the style analysis needs).

```bash
mkdir -p ~/god-agent/grants/successful
# Copy your funded proposals in. From Windows you can paste files into:
#   \\wsl$\Ubuntu-24.04\home\<you>\god-agent\grants\successful
```

Accepted formats: `.pdf` (must have real selectable text — not scanned images), `.txt`, `.md`,
`.docx`. The more representative winners you include, the truer both the style and the blueprint.

---

## Phase 2 — Train your linguistic style

Train a style profile from that folder and give it a name:

```bash
/god-learn-style grant-style ~/god-agent/grants/successful
```

(or, outside the console: `node scripts/learn-style.mjs grant-style ~/god-agent/grants/successful`)

Confirm it registered and note the exact **profile key** it prints — you'll pass it to FCDP:

```bash
node scripts/style-status.mjs        # e.g. "grant-style-a1b2c3d4"
```

> This step is local, CPU-only, and free. It reads your grants and stores a Lanham voice
> fingerprint plus vocabulary/tone characteristics. It does **not** consume API credit.

---

## Phase 3 — Extract the Winning-Grant Blueprint

This captures *how your grants win* — their structure, rigor, and rhetoric — as a reusable template.
Open the console and ask the assistant to analyze your winners and write the blueprint to a file:

```bash
claude
```

Paste a prompt like this:

> Read every grant in `grants/successful/`. Produce a reusable **Winning-Grant Blueprint** and save
> it to `grants/winning-grant-blueprint.md`. For the blueprint, extract, across these successful
> proposals: (1) the **section architecture** they share (e.g. Specific Aims → Significance →
> Innovation → Approach → Broader Impacts, or whatever pattern *these* grants actually use), with a
> typical word-length for each section; (2) for each section, the **rhetorical move** it performs and
> the order of moves within it; (3) how they establish **significance** and **innovation**, and how
> they signal **rigor** (preliminary data, feasibility, risk/alternative strategies); (4) recurring
> **framing and transition** patterns; (5) the evidence/citation density per section. Describe
> patterns and structure only — do **not** copy proprietary content into the blueprint.

Review the blueprint it writes; edit anything you disagree with. Optionally, pick your **one or two
strongest** proposals as in-context models:

```bash
mkdir -p ~/god-agent/grants/exemplars
cp ~/god-agent/grants/successful/<your-best-grant>.pdf ~/god-agent/grants/exemplars/
```

You now have both halves: a trained **style profile** (Phase 2) and a **blueprint + exemplars**
(Phase 3). These are reusable across every future proposal — you do Phases 1–3 once.

---

## Phase 4 — Bring in the NEW grant you're applying for

Create a folder for this specific proposal and add the solicitation and your project facts:

```bash
mkdir -p ~/god-agent/grants/current/<grant-name>
```

Put in it:
- The **funding solicitation / RFP / FOA** (the agency's call, with its review criteria and page
  limits) — as `.pdf`, `.txt`, or `.md`.
- A **project facts** file you write (`project-facts.md`): your aims, hypotheses, preliminary data,
  methods, team, timeline, budget notes — the raw material the draft will assert. Mark anything
  uncertain as `[UNCERTAIN]`.

These become the drafting pack: the solicitation defines the *task and requirements*, your facts
file is the *evidence* the proposal is built from.

---

## Phase 5 — Add the literature-review articles to the corpus and ingest

Put the articles you'll cite into a corpus subfolder, then embed them so the system can search them
and pull **verifiable** quotes into the draft.

```bash
mkdir -p ~/god-agent/corpus/<grant-name>-litreview
# add the article PDFs/txt/md into that folder, then:
node scripts/corpus-ingest.mjs corpus/<grant-name>-litreview
```

This extracts each article's text (`pdftotext` for PDFs), splits it into passages, and stores them
in the local vector database (ChromaDB). *(Requires the embedding server from Phase 0. Articles must
be text PDFs — scanned images won't extract; the tool warns and skips them.)*

Check it worked by searching a theme:

```bash
node scripts/corpus-ingest.mjs --search "spatial presence and learning outcomes" --n 8
```

You'll get the most relevant passages with their source filename and a similarity score. This is
what pack assembly (Phase 7) draws on.

---

## Phase 6 — Draft the proposal with FCDP (style + blueprint driven)

Now use the interactive drafting protocol (full spec: `FCDP-DRAFTING-PROTOCOL.md`). Draft
**one section at a time** — FCDP does one movement per cycle, and grant sections are distinct.

Open the console and start with the first section (e.g. Specific Aims):

```bash
claude
```

> Follow `FCDP-DRAFTING-PROTOCOL.md` to draft the **Specific Aims** section (~1 page) of the grant in
> `grants/current/<grant-name>/`. **Style target (G-A):** my trained profile `grant-style-XXXX` — hit
> its Lanham fingerprint. **Structure/rigor target:** follow `grants/winning-grant-blueprint.md` for
> this section's architecture and rhetorical moves; use `grants/exemplars/` as models of tone and
> rigor (as *models*, never copy their content). **Pack:** the solicitation and `project-facts.md` in
> this grant's folder — assert only what's in my facts file, graded as written; anything missing
> becomes a `******` placeholder. Start at Stage P, show me the D1 plan (mapped onto the blueprint's
> section structure) for approval before writing prose, and run `scripts/analyze-lanham.ts <draft>
> grant-style-XXXX` on every draft before showing it to me.

The assistant will:
1. **Assemble the pack** — your solicitation + facts + the blueprint + exemplars. No web/corpus
   retrieval; your material is authoritative.
2. **Show a plan (D1)** whose movements map onto the blueprint's structure, with per-movement style
   targets from your profile — **you approve before any prose.**
3. **Draft (D2)** in your voice, writing around `«Q1»` markers where a citation belongs rather than
   inventing sources.
4. **Run the gauntlet** — the `analyze-lanham.ts` style gate against `grant-style-XXXX`, plus
   fidelity/consistency checks — revising up to 3×.
5. **Hand back** the section draft for your review. Save it to
   `grants/current/<grant-name>/drafts/`.

Repeat for each section (Significance, Innovation, Approach, …), pointing at the same profile,
blueprint, and pack each time.

---

## Phase 7 — Draft the literature review with FCDP (grounded in your articles)

Same protocol, but the pack is built from the **ingested articles** so every claim is sourced and
every quote is exact. In the console:

> Follow `FCDP-DRAFTING-PROTOCOL.md` to draft the **Literature Review** (~2 pages) for the grant in
> `grants/current/<grant-name>/`, in my `grant-style-XXXX` voice and following the blueprint's rigor
> for a review section. **Build the pack from my ingested corpus:** for each theme of the review, run
> `node scripts/corpus-ingest.mjs --search "<theme>"` to surface the relevant passages from
> `corpus/<grant-name>-litreview`, and from those passages assemble the pack's quote index and a
> quotes JSON (`grants/current/<grant-name>/litreview-quotes.json`) with `«Qnn»` IDs, each entry
> holding the **verbatim** quote and its citation. Draft the review synthesizing the themes (not
> article-by-article summary), writing `«Qnn»` where quotes go; then run
> `python3 scripts/substitute-quote-ids.py <draft> litreview-quotes.json <out>` so the quotes are
> inserted exactly, and run the gauntlet including the citation-rigor gate (every citation traces to
> a real passage — none from memory).

Why this works: ingestion (Phase 5) makes the articles **searchable and quotable**; the assistant
pulls real passages into the pack; the `«Qnn»` mechanism means quotes are copied in mechanically,
never generated — so the review is grounded, quotable, and citation-clean, in your voice.

> Prefer to skip the vector database for a small article set? You can instead tell the assistant to
> read the PDFs in `corpus/<grant-name>-litreview` directly and pull quotes with page numbers into
> the pack. Ingestion (Phase 5) is the better path once you have many articles or reuse them across
> proposals, because search finds the right passages for you.

---

## Phase 8 — Assemble and finalize

1. **Stitch the sections** into the full proposal in `grants/current/<grant-name>/drafts/`.
2. **Whole-document consistency pass.** In the console: *"Run the FCDP G-G consistency gate across the
   assembled proposal — flag any section that contradicts another, any term used inconsistently, and
   any claim asserted beyond my facts file."*
3. **Final style pass.** Re-run the style gate on the full document:
   ```bash
   npx tsx scripts/analyze-lanham.ts grants/current/<grant-name>/drafts/full-proposal.md grant-style-XXXX
   ```
   Ask the assistant to bring any out-of-band section back toward your fingerprint (sentence
   architecture only).
4. **Your review.** The system drafts; you decide. Check every `******` placeholder, verify the
   argument, confirm each quote and citation. Nothing is final until you say so.

---

## Reusing this for the next grant

Phases 1–3 (style profile + blueprint + exemplars) are **done once** and reused. For each new
proposal you only do Phases 4–8: add the new solicitation and facts, ingest that proposal's
articles, and run FCDP. As you win more grants, re-run Phase 2 on the enlarged `grants/successful/`
folder to sharpen the trained voice, and refresh the blueprint in Phase 3.

## Quick command reference

| Step | Command |
|---|---|
| Start services | `./embedding-api/api-embed.sh start` · `npm run god-agent:start` |
| Train style | `/god-learn-style grant-style ~/god-agent/grants/successful` |
| Find profile key | `node scripts/style-status.mjs` |
| Ingest lit-review articles | `node scripts/corpus-ingest.mjs corpus/<grant>-litreview` |
| Search the corpus | `node scripts/corpus-ingest.mjs --search "theme" --n 8` |
| Style gate (draft vs your voice) | `npx tsx scripts/analyze-lanham.ts <draft> <profile-key>` |
| Insert exact quotes | `python3 scripts/substitute-quote-ids.py <draft> <quotes.json> <out>` |
| Draft | in `claude`: "Follow FCDP-DRAFTING-PROTOCOL.md …" |
