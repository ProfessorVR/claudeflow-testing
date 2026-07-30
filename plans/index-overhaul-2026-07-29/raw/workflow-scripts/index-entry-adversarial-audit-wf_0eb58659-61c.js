export const meta = {
  name: 'index-entry-adversarial-audit',
  description: 'Adversarial per-entry audit of all 27 corpus/index entries against a claim/clause-level indexing goal',
  phases: [
    { title: 'Audit', detail: '12 agents covering all 27 entry directories' },
    { title: 'Verify', detail: 'adversarial refutation of each high-severity finding' },
    { title: 'Synthesize', detail: 'cross-entry patterns, schema census, gap to claim-level goal' },
  ],
}

const REPO = '/home/dalton/projects/claudeflow-testing'

const GOAL = `
THE USER'S ULTIMATE GOAL (this reframes everything you evaluate):
Build, maintain, and leverage a LARGE and EXTRAORDINARILY DETAILED index of every document —
"every claim and every clause, every point of connection and every weakness."
That is roughly TWO granularity levels below what the current index encodes (current unit = a
chapter or an article). Judge every entry against BOTH:
  (a) its own stated standard (the cluster template / its own manifest and quality gates), AND
  (b) the claim-level / clause-level target above.
Where the entry is excellent by (a) but structurally incapable of (b), SAY SO EXPLICITLY.
`

const RULES = `
REPO: ${REPO}   (branch feat/wraith-retrieval)

STRICTLY READ-ONLY. Do not modify, create, move, or delete ANY file. Do not run git add/commit/checkout/stash/clean.
Do not run the compiler. Do not start services. Read and analyse only.
Ignore any path containing /.backups/ — those are snapshots, not live content.

ADVERSARIAL STANCE. You are not summarising; you are trying to BREAK the entry.
Assume every claim the entry makes about itself is false until you have opened the file and seen it.
Assume every manifest count is wrong until you have counted the files yourself.
Assume every declared source path is broken until you have stat'd it.
Assume every cross-reference is dangling until you have resolved it.
Quote path:line for every finding. A finding with no path:line is worthless — drop it.

CONTEXT YOU MUST NOT TAKE ON FAITH. A prior audit produced these claims. Several were later shown
wrong. Where your entry is covered by one of them, TEST it and record CONFIRMED / REFUTED / PARTIAL:
- "~310 unit records, 691 unit analyses, ~9,762 distinct edges on disk; ZERO reach runtime."
- "The compiler reads only 4 filename patterns: book-level-ontology.md, cluster-ontology.md,
   *-ontology.md (Aristotle only), *-cross-pipeline-hooks.md (Aristotle only), plus tension-edges.json."
- "42 distinct edge-CSV header dialects, 633 distinct relation values, 31 unenforced ID prefixes."
- "Only ~10 manifests record source PDFs; 9 entries have NO machine-readable source path."
- "Only 2 of 27 entries have a quality-gates-report.md; only 1 has machine-readable metrics."
- "ig-10-incorporation.json is the only unparseable JSON of 494."
- "4 of 11 tension-edges.json files yield ZERO edges silently (schemas pole_A/pole_B,
   wendt_position/against, and two label/description-only forms)."
- "67 .mmd files across 15 entries encode 1,544 arrow-edges reachable by nothing."
- "144 cross_pipeline_bridges entries live in 22 unit JSONs; runtime has 72 hooks, 100% Aristotle."
- "35 *-deep.json files carry positions/tensions/interlocutors/ratio-catalogs with no canonical slot."
- "Per-source *-edges.csv and _synthesis/global-edges.csv are the SAME data serialized twice, but
   four entries disagree between the layers (FCM 428 vs 452, Aristotle 246 vs 156, Grammar 878 vs 876,
   Phantasia 708 vs 706). Nothing records which is stale."

${GOAL}

USEFUL COMMANDS (adapt; always quote paths — most entry dirs contain spaces and parentheses):
  find "corpus/index/<ENTRY>" -type f -not -path '*/.backups/*' | sed 's|.*/||' | sort
  python3 -c "import json,pathlib,sys; [ ... ]"     # parse-check every JSON
  head -1 on every *.csv to census header dialects
  cut -d, -f2 on edge CSVs to census relation vocabularies
  grep -rn 'corpus/' "corpus/index/<ENTRY>" to find declared source paths, then test each with ls
  Compare manifest.json declared counts against actual file counts
  Check whether the entry appears in scripts/compile-corpus-index.py TEXT_DIRS (line ~35-133)
  Check corpus/index/compiled-index.json for nodes whose "text" attributes to this entry
`

const ENTRY_SCHEMA = {
  type: 'object',
  required: ['entries', 'batch_notes'],
  properties: {
    entries: {
      type: 'array',
      items: {
        type: 'object',
        required: ['entry', 'layout_family', 'file_census', 'reachability', 'defects', 'provenance', 'granularity_gap', 'strengths', 'verdict'],
        properties: {
          entry: { type: 'string', description: 'exact directory name under corpus/index/' },
          layout_family: { type: 'string', description: 'article-per-folder cluster | monograph units+_synthesis | structured/analysis pair | flat work-mapped | flat data/video | md-only | pipeline run-history | other (describe)' },
          file_census: {
            type: 'object',
            required: ['total_files', 'by_extension', 'unit_records', 'unit_analyses', 'edge_csv_files', 'edge_rows_per_source', 'edge_rows_synthesis', 'mmd_files', 'json_parse_failures'],
            properties: {
              total_files: { type: 'integer' },
              by_extension: { type: 'string', description: 'e.g. "md:41 json:22 csv:14 mmd:2"' },
              unit_records: { type: 'integer', description: 'structured per-unit JSON records ONLY — exclude manifest.json, *-greek.json, appendices, ontology files. State exclusions in notes.' },
              unit_analyses: { type: 'integer', description: 'per-unit markdown analyses' },
              edge_csv_files: { type: 'integer' },
              edge_rows_per_source: { type: 'integer', description: 'total rows across per-unit/per-source edge CSVs (exclude header rows)' },
              edge_rows_synthesis: { type: 'integer', description: 'rows in _synthesis/global-edges.csv or equivalent; 0 if none' },
              mmd_files: { type: 'integer' },
              json_parse_failures: { type: 'array', items: { type: 'string' }, description: 'path:error for each JSON that fails json.loads' },
            },
          },
          reachability: {
            type: 'object',
            required: ['registered_in_TEXT_DIRS', 'ontology_format', 'nodes_in_compiled_index', 'what_reaches_runtime', 'what_never_reaches_runtime', 'percent_of_authored_content_reachable'],
            properties: {
              registered_in_TEXT_DIRS: { type: 'boolean' },
              ontology_format: { type: 'string', description: 'header | table | json-on-disk-but-unread | prose-dialect-unparseable | none' },
              nodes_in_compiled_index: { type: 'integer', description: 'count of ontologyNodes in compiled-index.json attributable to this entry; -1 if you could not determine' },
              what_reaches_runtime: { type: 'string' },
              what_never_reaches_runtime: { type: 'string' },
              percent_of_authored_content_reachable: { type: 'string', description: 'rough %, with the basis you used' },
            },
          },
          defects: {
            type: 'array',
            description: 'Every defect you can evidence. Be exhaustive. Include schema violations, broken cross-refs, count mismatches, ID-prefix violations, empty/stub files, contradictions between manifest and reality, unverified quotations, missing gates.',
            items: {
              type: 'object',
              required: ['severity', 'category', 'path_line', 'claim', 'evidence', 'consequence'],
              properties: {
                severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
                category: { type: 'string', description: 'kebab-case, e.g. schema-violation, count-mismatch, dangling-reference, unverified-quotation, missing-apparatus, id-collision, encoding-corruption, unreachable-content' },
                path_line: { type: 'string', description: 'repo-relative path, with :line where applicable' },
                claim: { type: 'string' },
                evidence: { type: 'string', description: 'the actual bytes/output you saw' },
                consequence: { type: 'string', description: 'what breaks downstream' },
              },
            },
          },
          provenance: {
            type: 'object',
            required: ['declared_source_paths', 'resolvable_count', 'broken_paths', 'notes'],
            properties: {
              declared_source_paths: { type: 'array', items: { type: 'string' } },
              resolvable_count: { type: 'integer' },
              broken_paths: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
            },
          },
          quality_apparatus: {
            type: 'object',
            properties: {
              has_manifest: { type: 'boolean' },
              has_quality_gates_report: { type: 'boolean' },
              has_concept_matrix: { type: 'boolean' },
              has_debate_map: { type: 'boolean' },
              has_citation_network: { type: 'boolean' },
              has_render_validation: { type: 'boolean' },
              declared_counts_vs_actual: { type: 'string' },
            },
          },
          granularity_gap: { type: 'string', description: 'What is the FINEST unit of analysis this entry actually encodes? How far is that from claim-level and clause-level? What would have to be added? Is any claim-level or clause-level material ALREADY present but unstructured (e.g. inside prose analyses)?' },
          strengths: { type: 'array', items: { type: 'string' }, description: 'What this entry does that is genuinely valuable and must be preserved by any redesign' },
          verdict: { type: 'string', description: 'One paragraph: is this entry sound, salvageable, or should it be rebuilt? Argue it.' },
        },
      },
    },
    batch_notes: { type: 'string', description: 'Cross-entry observations within your batch; prior-claim verdicts (CONFIRMED/REFUTED/PARTIAL) with evidence; anything that surprised you.' },
  },
}

const BATCHES = [
  { label: 'boredom-secondary', entries: ['Boredom Secondary (Part III)'], note: 'The nominated GOLD STANDARD cluster, 189 files, 55 units, ~3,815 edge rows. Ships a compiler-native cluster-ontology.json (nodeCount 68, generatedBy parse_header_ontology) AND registers via markdown — test the double-count risk. 17 of its 55 units reportedly have ambiguous domain provenance because sourceFile values are bare filenames. Scrutinise this one hardest: everything downstream is measured against it.' },
  { label: 'vr-pedagogy', entries: ['VR Pedagogy Secondary (Part III)'], note: '127 files, 34 units, ~2,260 edge rows, md-only "Part III lite" layout. Ships a minimal cluster-ontology.json {cluster, nodes[60]} AND registers via markdown. A known surname correction (ped-sec-14: Barrett, not "Colin") landed recently — verify it propagated to EVERY file, not just prose.' },
  { label: 'aristotle-complete', entries: ['Aristotle - Complete Works'], note: '131 files. Registered as ontology_format "table" with NO ontology file; its 199 nodes and ALL 72 crossPipelineHooks arrive only via ARISTOTLE_WORK_MAP and a hardcoded directory literal at compile-corpus-index.py:1239. 34 structured unit records claimed (not 45 — the extra 11 are 9 *-greek.json + greek-appendix + bekker-index). Mixed uppercase unit_id vs lowercase filenames. Also verify the recorded claim that bekker-index PDF page numbers are WRONG for ~30 entries.' },
  { label: 'dissertation-and-method', entries: ['Dissertation', 'Game-Behavior Analysis Method (Burke × Calleja)'], note: 'Dissertation = 358 files, claimed to be a pipeline run-history store, NOT a source-text entry, yet holds 33 units and 1,682 edge rows. Game-Behavior = 33 files, 9 versions of one methodology document, and reportedly the ONLY index content with chunks actually live in ChromaDB (25 chunks from 6 PDFs). Determine what each ACTUALLY is and whether the analysis-artifact classification is correct.' },
  { label: 'salvo-artifacts', entries: ['Red Dead Redemption 2 (Salvo Playthrough)', 'Veri(dis)similitude (Salvo MA)'], note: 'Both classified analysis-artifact (decision D4): no synthesis layer, excluded from source-entry gates, but still meant to be reachable by entry-scoped retrieval. RDR2 Playthrough = 141 files including 22 .vtt transcripts and video-analysis material. Veri(dis)similitude = the user\'s own MA thesis being rewritten into Part II. Test whether "no synthesis layer" is a design decision or an excuse, and whether the .vtt transcripts are indexable content being thrown away.' },
  { label: 'burke', entries: ['A Grammar of Motives (Burke 1945)', 'A Rhetoric of Motives (Burke 1950)'], note: 'Grammar: 91 files, 28 units, ~1,754 edge rows, ships global-edges-pre-canonical.csv (a file the *-edges.csv glob MISSES). Rhetoric of Motives: 35 files, 8 units, ships 8 files named plain edges.csv (also missed by the glob), and reportedly lacks both concept-matrix and manifest. Grammar reportedly disagrees between edge layers 878 vs 876.' },
  { label: 'calleja-uncomfortable', entries: ['In-Game (Calleja 2011)', 'Uncomfortable Situations'], note: 'In-Game: 79 files, 26 units, 13 chapters each meant to carry a topical+deep PAIR. ig-10-incorporation.json is claimed to be the ONLY unparseable JSON in the entire index — a bracket-TYPE mismatch at :155 (`],` should be `},`), with :134 opening `"non_game_studies_anchor_theories": {`. VERIFY THAT PRECISELY, byte by byte, and determine whether ig-10-deep.{json,md,-edges.csv} or ig-10-incorporation.json is authoritative for chapter 10. Uncomfortable Situations: 46 files, only 6 units against 36 nodes and 744 edge rows — an odd ratio; explain it. It is also one of only two entries with a render-validation.txt.' },
  { label: 'heidegger-bt-bcap', entries: ['Heidegger - Being and Time', 'Heidegger - Basic Concepts of Aristotelian Philosophy'], note: 'BT: 53 files, 17 units (manifest.json says total_units 17 — the 18th .json IS manifest.json; confirm). BCAP: 42 files, 13 units. Both are structured/analysis-pair layout. The node "Destruktion" reportedly gets merged across BT and Heidegger and Rhetoric by deduplicate_ontology_nodes keying on lowercased name with no text component — check what OTHER node names collide across these entries.' },
  { label: 'heidegger-fcm-rhetoric', entries: ['Heidegger - The Fundamental Concepts of Metaphysics', 'Heidegger and Rhetoric'], note: 'FCM: 61 files, 15 units, 880 edge rows, and reportedly DISAGREES between edge layers 428 vs 452 — find out which is stale and why. Heidegger and Rhetoric: 49 files, 16 units, only 204 edge rows against 36 nodes. FCM carries the King-Salvo boredom bridge (second form of boredom) which is load-bearing for Part III.' },
  { label: 'wendt-uexkull-rickert', entries: ['Wendt - Design for Dasein', 'Von Uexkull - A Foray into the Worlds of Animals and Humans', 'Rickert - Ambient Rhetoric'], note: 'Wendt: 48 files, 8 units (dfd-00..dfd-07 — a prior audit UNDERCOUNTED this at 7), 614 edge rows, and is the control case used to prove per-source and synthesis edge layers are the same data (307 rows / 305 distinct on both sides). Uexküll: 47 files, 14 units per its own manifest — Gate W1 in the plan disputes 14 vs 15; settle it. Rickert: 32 files, 10 units, only 56 edge rows — and is the entry whose parse pollution surfaced a general compiler bug (one centralityTier field holding 10,009 chars of a dumped edge table, its units array holding 973 garbage tokens). FIND that polluted node in compiled-index.json and characterise exactly what got absorbed.' },
  { label: 'unregistered-clusters', entries: ['Red Dead Redemption 2 Secondary (2019-2023)', 'Aristotelian Phantasia Secondary (1985-2017)', 'Aristotelian Emotion Secondary (1975-2015)', 'Aristotelian Motion and Time Secondary'], note: 'All FOUR are unregistered — zero nodes reach runtime. Phantasia (46 files, 8 units, 1,414 edge rows) is the nominated example for cross-cutting groups and ships cluster-ontology.json with 41 concepts the compiler never opens; its ontology markdown is a PROSE DIALECT no parser can read (bold inline IDs like **PHX-C-001 phantasia** rather than numbered headers). RDR2 Secondary: 60 files, 12 units, ships thin JSON (21 concepts: concept/units/tier). Emotion Secondary: 33 files, 5 units, thin JSON (40 concepts: label/units only). Motion and Time: FIVE FILES TOTAL, abandoned mid-creation — document precisely what exists and what a completion would require. Quantify exactly how much authored value is stranded across these four.' },
  { label: 'ontology-only-five', entries: ['Virtual Learning Environments (King–Salvo)', 'Presence Theory (Foundations)', 'Social Presence in Virtual Worlds (Part III)', 'Rhetoric of Interactivity and Virtual Reality (Part III)', 'Boredom Experiment (VR Attention Study)'], note: 'The five "ontology-only" entries: registered, contributing concept names, but claimed to have ZERO structured unit records and ZERO edges. Total 43 files across all five. Decision D3 ratifies FULL treatment for all of them. VLE has a known BROKEN declared source path at units/vle-05-*.md:3 pointing to a lowercase corpus/virtual_learning_environments/ that does not exist — verify and find any others. The Part III presence units carry a self-declared defect: "Candidate quotations — ALL UNVERIFIED (OCR-only; re-verify against a clean PDF)" — find every instance and count the affected quotations, since these are CITED in the dissertation. Boredom Experiment covers 5 channels (self-report, EEG, gaze, first-person VR feed, stimulus corpus). Assess whether "full treatment" is even the right target for entries this thin, or whether they are really groups over sources that should be their own entries.' },
]

phase('Audit')

const audited = await pipeline(
  BATCHES,
  (b) => agent(
    `${RULES}

YOUR BATCH: ${b.entries.map((e) => `"corpus/index/${e}"`).join(', ')}

BATCH-SPECIFIC BRIEF (test every assertion in it — several may be wrong):
${b.note}

TASK. For EACH entry in your batch, conduct an exhaustive adversarial audit. Work the filesystem hard:
1. Full file inventory by extension. Count units, analyses, edge CSVs, edge rows (per-source AND synthesis), .mmd files.
2. Parse-check EVERY .json file. Report any failure with the exact error.
3. Census EVERY .csv header (head -1) and the relation vocabulary. Note dialect divergence.
4. Open the manifest (if any) and test every declared count and every declared path against reality.
5. Determine registration status and exactly what reaches compiled-index.json.
6. Hunt for: dangling cross-references between files, ID-prefix violations and collisions, stub or
   near-empty files, contradictions between a unit's .json and its .md twin, unverified or
   unattributed quotations, encoding damage (ligature loss like "beneficial"->"benefcial" is a KNOWN
   corpus-wide hazard from a pdfium bug — grep for it), duplicated content, and orphaned files
   referenced by nothing.
7. Assess the granularity gap against the claim/clause-level goal. Critically: is claim-level material
   ALREADY present inside the prose analyses in unstructured form? Quantify if so — that changes the
   cost of the whole programme.
8. Record what is genuinely GOOD and must survive a redesign. Be specific.

Return the structured object. Be exhaustive on defects — 20 evidenced defects beats 5 tidy ones.
Do not pad with unevidenced speculation; every defect needs a path and observed bytes.`,
    { label: `audit:${b.label}`, phase: 'Audit', schema: ENTRY_SCHEMA }
  ),
  (res, b) => {
    if (!res || !res.entries) return { batch: b.label, result: res, verified: [] }
    const critical = res.entries.flatMap((e) =>
      (e.defects || []).filter((d) => d.severity === 'CRITICAL' || d.severity === 'HIGH').map((d) => ({ entry: e.entry, ...d }))
    )
    if (!critical.length) return { batch: b.label, result: res, verified: [] }
    const sample = critical.slice(0, 8)
    return parallel(
      sample.map((d) => () =>
        agent(
          `${RULES}

You are an ADVERSARIAL VERIFIER. Another agent claims the following defect exists. Your job is to REFUTE it.
Default to refuted=true unless you personally open the file and observe the exact evidence.

  entry:       ${d.entry}
  severity:    ${d.severity}
  category:    ${d.category}
  location:    ${d.path_line}
  claim:       ${d.claim}
  evidence:    ${d.evidence}
  consequence: ${d.consequence}

Check specifically for these failure modes in the original claim:
- Wrong line numbers (off-by-one, or citing a blank line).
- Counting the wrong denominator (attributions vs objects; rows vs distinct triples; files vs records).
- Including .backups/ paths in a count.
- Mistaking a design decision for a defect.
- A "missing" file that exists under a different name or in _synthesis/.
- A consequence that does not actually follow from the observed fact.
- A count that is right but whose stated basis is wrong.

Return your verdict. If the defect is real but the severity or the stated consequence is wrong,
return refuted=false with a corrected_severity and corrected_claim.`,
          {
            label: `verify:${d.entry.slice(0, 22)}:${d.category.slice(0, 14)}`,
            phase: 'Verify',
            schema: {
              type: 'object',
              required: ['refuted', 'reasoning', 'evidence_examined'],
              properties: {
                refuted: { type: 'boolean' },
                reasoning: { type: 'string' },
                evidence_examined: { type: 'string', description: 'the exact commands run and bytes observed' },
                corrected_severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NOT-A-DEFECT'] },
                corrected_claim: { type: 'string' },
              },
            },
          }
        ).then((v) => ({ defect: d, verdict: v }))
      )
    ).then((verdicts) => ({ batch: b.label, result: res, verified: verdicts.filter(Boolean) }))
  }
)

phase('Synthesize')

const clean = audited.filter(Boolean)
const allEntries = clean.flatMap((c) => (c.result && c.result.entries) || [])
const allVerdicts = clean.flatMap((c) => c.verified || [])
const notes = clean.map((c) => `### ${c.batch}\n${(c.result && c.result.batch_notes) || '(none)'}`).join('\n\n')

log(`Audited ${allEntries.length} entries; ${allVerdicts.length} high-severity defects adversarially verified`)

const compact = allEntries.map((e) => ({
  entry: e.entry,
  layout: e.layout_family,
  census: e.file_census,
  reach: e.reachability,
  defect_count: (e.defects || []).length,
  defects: (e.defects || []).map((d) => `[${d.severity}] ${d.category} @ ${d.path_line} — ${d.claim}`),
  provenance: e.provenance,
  apparatus: e.quality_apparatus,
  granularity_gap: e.granularity_gap,
  strengths: e.strengths,
  verdict: e.verdict,
}))

const refutations = allVerdicts
  .filter((v) => v.verdict && v.verdict.refuted)
  .map((v) => `REFUTED — ${v.defect.entry} / ${v.defect.category} @ ${v.defect.path_line}: ${v.verdict.reasoning}`)
const confirmations = allVerdicts
  .filter((v) => v.verdict && !v.verdict.refuted)
  .map((v) => `CONFIRMED${v.verdict.corrected_severity ? ` (severity→${v.verdict.corrected_severity})` : ''} — ${v.defect.entry} / ${v.defect.category} @ ${v.defect.path_line}: ${v.verdict.corrected_claim || v.defect.claim}`)

const synthesis = await agent(
  `${RULES}

You are synthesising a 12-agent adversarial audit of all 27 corpus/index entry directories.

PER-ENTRY RESULTS (JSON):
${JSON.stringify(compact).slice(0, 220000)}

BATCH NOTES:
${notes.slice(0, 60000)}

ADVERSARIAL VERIFICATION OUTCOMES:
CONFIRMED (${confirmations.length}):
${confirmations.join('\n').slice(0, 40000)}

REFUTED (${refutations.length}):
${refutations.join('\n').slice(0, 40000)}

Produce a synthesis in MARKDOWN. Be concrete and quantitative; cite path:line throughout. Sections:

## 1. Corrected census
One table, all 27 entries: layout family, registered?, units, unit analyses, per-source edge rows,
synthesis edge rows, .mmd files, nodes reaching runtime, defect count. Then state the CORRECTED
totals for units / analyses / distinct edges, and show your derivation. Explicitly flag every place
the prior audit's numbers (310 units / 691 analyses / 9,762 distinct edges) are wrong, and by how much.

## 2. The schema census
Every unit-JSON shape family, every edge-CSV header dialect, every ontology dialect, every manifest
shape, every ID prefix, with which entries use which. This is the input to a normalization layer, so
it must be exact and complete. Name the shapes.

## 3. Defects ranked
All CONFIRMED defects, most severe first, grouped by category. Include the REFUTED ones in a short
appendix table so the record is honest about what did not survive scrutiny.

## 4. Cross-entry patterns
What recurs? Which defects are systemic (a property of the authoring process or the template) versus
one-off? Which entries are outliers and why?

## 5. What is genuinely excellent
The parts of this index that a redesign must preserve. Be specific and name files. The user has spent
roughly 40 hours per entry on the best ones — identify exactly what that bought.

## 6. The granularity verdict — the most important section
Against the goal of "every claim and every clause, every point of connection and every weakness":
- What is the finest unit the index encodes today, entry by entry?
- How much claim-level material ALREADY exists in unstructured prose form, and where? Quantify.
- Which entries could be mechanically decomposed to claim level, and which would need re-authoring?
- What is the realistic multiplier — if 27 entries hold ~N units today, how many CLAIMS and CLAUSES
  would a complete index hold? Show your arithmetic from observed data.
- State plainly whether the current entry format is a foundation for the goal or an obstacle to it.

## 7. The ten things that must be true before any entry is authored again
Ranked, each with the evidence that motivates it.`,
  { label: 'synthesis:entries', phase: 'Synthesize', effort: 'high' }
)

return { entriesAudited: allEntries.length, verified: allVerdicts.length, confirmed: confirmations.length, refuted: refutations.length, synthesis }
