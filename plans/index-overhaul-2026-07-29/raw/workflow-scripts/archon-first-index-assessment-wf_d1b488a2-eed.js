export const meta = {
  name: 'archon-first-index-assessment',
  description: 'Assess implementing the claim/clause index overhaul in archon-cli rather than claudeflow-testing',
  phases: [
    { title: 'Assess', detail: '8 agents: archon readiness, corpus adapter cost, compatibility, and an adversarial critic' },
    { title: 'Verify', detail: 'adversarial refutation of load-bearing claims' },
    { title: 'Decide', detail: 'synthesis with a clear recommendation and a migration shape' },
  ],
}

const CF = '/home/dalton/projects/claudeflow-testing'
const AR = '/home/dalton/projects/archon-cli'

const CONTEXT = [
  'THE QUESTION: should the corpus-index overhaul be implemented in archon-cli (Rust) rather than in',
  'claudeflow-testing (Python compiler + TypeScript runtime)? Give an evidence-based answer, not a preference.',
  '',
  'ESTABLISHED FACTS from a completed 231-agent adversarial review (treat as given, but correct if wrong):',
  '',
  'THE GOAL: "a large and extraordinarily detailed index of every document. Every claim and every clause.',
  'Every point of connection and every weakness." Sizing: ~224 docs x ~200 claims = ~45,000 claims;',
  'x ~10 clauses = ~450,000 clause records.',
  '',
  'STATE OF claudeflow-testing (the incumbent):',
  '- corpus/index/ = 27 hand-authored entries, 1,758 files, 34.6 MB, seven incompatible layouts,',
  '  42 edge-CSV header dialects, 645 relation values, 31 unenforced id prefixes, no schema file, no validator.',
  '- scripts/compile-corpus-index.py = 1,412 lines. Emits ZERO stderr warnings on the live corpus while',
  '  discarding ~38% of what it reads. No argparse, no sys.exit, no assert; main() always returns 0.',
  '  All five parsers discard text offsets in the FIRST STATEMENT of every function, so no character',
  '  position is ever available. Registration is a hand-edited 19-key dict that has lost 8 of 27 dirs.',
  '  It ignores 12 structured *-ontology.json files sitting in the directories it scrapes.',
  '- Output: compiled-index.json, 664 KB, 701 ontologyNodes / 72 crossPipelineHooks / 64 tensionEdges /',
  '  1,722 canonicalTerms. Node records have NO id, NO page, NO quote, NO locus.',
  '- TypeScript runtime: npx tsc --noEmit reports 157 errors, so npm run build cannot succeed; everything',
  '  runs through tsx (transpile-only). ZERO tests reference the three index modules. No CI job references',
  '  the compiler or the artifact. Three duplicate CompiledIndex type declarations with divergent shapes.',
  '- Known runtime defects: t.includes("") always-true bridge matcher (31 of 72 hooks fire for every topic);',
  '  the prompt emits "Bridge: X (Aristotle) <-> ? (Unknown) ... both authors MUST be cited";',
  '  _hooksDerivationDone one-shot global with no reset; dedup by page_start across all authors;',
  '  5,437 reasoning edges rejected at runtime by a schema mismatch (PASS: 0 DROPPED: 5437).',
  '- Scalability ceilings measured: artifact format ~50x; loader 24.97x (V8 MAX_STRING_LENGTH);',
  '  retrieval pool hard-capped at 50; prompt caps are absolute integers so at 100x discard goes 82% -> 99.8%.',
  '- The review recommended: REPLACE the parse-and-emit layer (~1,100 of 1,412 lines) plus the TS matching',
  '  layer (~600 lines); KEEP the five markdown parsers as adapters and keep the loaders.',
  '',
  'STATE OF archon-cli (the proposal), verified live 2026-07-29:',
  '- Rust, 39 crates, CozoDB store at .archon/archon-data.db = 987 MB, 224 documents ingested.',
  '  claudeflow-testing/.archon is 28 KB and EMPTY. Binary archon 1.3.11 (7b44c665); HEAD 8758f2fa.',
  '- crates/archon-docs/src/schema.rs already declares doc_chunk_blocks {chunk_id, block_idx =>',
  '  char_start, char_end, page, x0, y0, x1, y1, block_type, text_hash}, doc_chunk_page_breaks, and',
  '  doc_chunk_hashes {raw_sha256, cleaning_version, commit_hash}.',
  '- crates/archon-docs/src/quote_verify.rs: locate_quote / find_fragment_bboxes return exact-vs-fuzzy,',
  '  similarity, matched source_span, SUB-SPAN-resolved page, SUB-SPAN-narrowed bbox, and a FragmentLocator',
  '  with kind Bekker or PageNumber read off the running head. MEASURED: "the soul is in a way all existing',
  '  things" returns exact/sim 1.000/p.48/bbox height 41pt/locator Bekker:431b1. The ped-sec-29 fabricated',
  '  quotation returns NO exact match, only fuzzy 0.741 and 0.704 on unrelated books.',
  '- It computes char offsets (a,b) via find_subslice and (lo,hi) via local_span_in_chunk, uses them to',
  '  narrow page and bbox, then DISCARDS them because QuoteFragment has no field for them.',
  '- REPORT_FLOOR = 0.60, so a fabricated quote still returns found:true. Gates must key on match_kind.',
  '- crates/archon-evidence/src/index.rs is ALREADY a Rust reader over compiled-index.json: parses',
  '  ontologyNodes / canonicalTerms / tensionEdges / crossPipelineHooks and implements canonical-term',
  '  greedy longest-match query expansion, tension-pole surfacing, and owning-work re-rank, with fixtures.',
  '- crates/archon-draft holds the FCDP pack format: Pack, QuoteIndexEntry {id, source, locus, description,',
  '  intended_use}, QuoteEntry {text, cite}, Verification {quotes_verified_at, verified_against, test_fixture},',
  '  and gp_validate. QuoteEntry carries NO chunk_id, NO offsets, NO bbox, NO match_kind. Verification is a',
  '  DATE, not a content check. This is where the user drafting protocol pulls its quotations from.',
  '- Branches include feat/evidence-curation, feat/fcdp-draft, feat/marker-server-parallel-ingest,',
  '  fix/wraith-clippy-remediation, backup/pre-clippy-remediation-2026-07-16.',
  '',
  "USER'S RECORDED DIRECTION: archon is device-agnostic; the stated endgame is porting the ENTIRE god-agent",
  'to Rust. Standing rules: commits and pushes from WSL only, never the Mac; ask before every push;',
  'verification-gated (show evidence, wait for sign-off before committing); back up before changes.',
].join('\n')

const RULES = [
  'REPOS: incumbent ' + CF + '   ·   proposal ' + AR,
  '',
  'STRICTLY READ-ONLY. Do not modify, create, move or delete ANY file in either repo. No git write',
  'operations of any kind. Do NOT run cargo build/test (expensive and writes to target/).',
  'You MAY run: read-only greps, file reads, git log/show/diff/branch, and READ-ONLY archon subcommands',
  '(archon docs list/status/inspect/provenance/verify-quote, archon evidence find) using the prebuilt',
  'binary at ' + AR + '/target/debug/archon, run from ' + AR + '. Never run ingest, reprocess, index,',
  'vector-migrate, vector-compact, or anything that writes to the store.',
  '',
  'EVIDENCE DISCIPLINE. Every claim needs path:line or a command and its output. Estimates must state',
  'their basis. Do not speculate about code you have not opened. If you cannot determine something,',
  'say so explicitly rather than guessing — an honest unknown is more useful than a confident invention.',
  '',
  CONTEXT,
].join('\n')

const SCHEMA = {
  type: 'object',
  required: ['scope', 'findings', 'archon_first_verdict', 'summary'],
  properties: {
    scope: { type: 'string' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['claim', 'evidence', 'bearing'],
        properties: {
          claim: { type: 'string' },
          evidence: { type: 'string', description: 'path:line or command + output' },
          bearing: { type: 'string', enum: ['FAVOURS-ARCHON', 'FAVOURS-INCUMBENT', 'NEUTRAL', 'RISK'] },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
      },
    },
    what_exists_already: { type: 'array', items: { type: 'string' }, description: 'capability in archon that the overhaul would otherwise have to build, each with path:line' },
    what_is_missing: { type: 'array', items: { type: 'string' }, description: 'capability the overhaul needs that archon does NOT have, each with a size estimate and its basis' },
    port_cost: { type: 'string', description: 'concrete estimate with the basis stated — lines, files, or comparable prior work in the repo' },
    risks: { type: 'array', items: { type: 'string' } },
    archon_first_verdict: { type: 'string', enum: ['STRONGLY-FAVOURS', 'FAVOURS', 'NEUTRAL', 'OPPOSES', 'STRONGLY-OPPOSES'] },
    summary: { type: 'string' },
  },
}

const SCOPES = [
  {
    label: 'index-reader-to-producer',
    brief: [
      'Read crates/archon-evidence/src/index.rs IN FULL, plus its tests and fixtures.',
      'Establish exactly what archon already does with compiled-index.json: the parsed shape, the',
      'canonical-term greedy longest-match, tension-pole surfacing, owning-work re-rank, and any caching.',
      'Then answer the central question: what would it take to make archon the PRODUCER of the index',
      'rather than only its consumer? Specifically:',
      '  (a) Could archon emit compiled-index.json as a LEGACY VIEW so the TypeScript drafting path in',
      '      claudeflow-testing keeps working unchanged? What exactly would it have to emit, field by field?',
      '      Compare the RawIndex/CompiledIndex structs against the real artifact at',
      '      ' + CF + '/corpus/index/compiled-index.json (701 nodes; read it).',
      '  (b) What Rust-side record types would a CLAIM and a CLAUSE need, given the schema already in',
      '      archon-docs (doc_chunk_blocks, doc_chunk_page_breaks, doc_chunk_hashes)?',
      '  (c) How large is the two-field change to expose char_start/char_end from QuoteFragment through',
      '      provenance_json and the verify-quote JSON emitter? Give the exact files and line ranges.',
      'Be concrete. This agent decides whether "archon becomes producer, compiled-index.json becomes a',
      'generated legacy view" is a real migration path or wishful thinking.',
    ].join('\n'),
  },
  {
    label: 'cozo-store-readiness',
    brief: [
      'Assess whether the CozoDB store can hold ~45,000 claim records and ~450,000 clause records.',
      'Read crates/archon-docs/src/schema.rs IN FULL and crates/archon-cozo/ to establish: every relation',
      'already declared, the storage engine (the file is SQLite-backed — verify), indexing, FTS support,',
      'and vector support (there is a doc-vector-store directory alongside the 987 MB db).',
      'Measure what is actually there READ-ONLY: the db is at ' + AR + '/.archon/archon-data.db.',
      'You may open it with sqlite3 in READ-ONLY mode (file:...?mode=ro) to count rows in the cozo table',
      '(2,751,189 rows were counted). Do NOT write. Cozo hides relation names behind catalogue ids, so',
      'prefer using the archon binary read-only subcommands to characterise contents.',
      'Determine: does doc_chunk_blocks actually contain rows? Evidence for this: verify-quote returns a',
      'SUB-SPAN-NARROWED bbox (188pt where the chunk box is 642pt), which implies block data is being used',
      '— trace the code path in quote_verify.rs fragment_for() and confirm which relation it reads.',
      'Then assess scale: at 450,000 clause records, what breaks? Compare against the incumbent ceilings',
      '(single JSON artifact ~50x, V8 MAX_STRING_LENGTH at 24.97x).',
    ].join('\n'),
  },
  {
    label: 'evidence-curation-state',
    brief: [
      'Establish the true state of the evidence-curation work, which is the closest existing thing to a',
      'claim-level pipeline in either repo.',
      'Read crates/archon-evidence/ IN FULL (lib.rs, index.rs, pack.rs, verify.rs, quote_trim.rs, outcome.rs).',
      'Read the plan documents: ' + CF + '/plans/archon-evidence-curation-plan*.md and any',
      'adversarial-review-RESULTS document, plus git log on branch feat/evidence-curation.',
      'Answer: what does "evidence curate" actually produce today? What is the record shape? Does anything',
      'already resemble a claim record with a locus? What does verify.rs verify and against what?',
      'A prior review recorded "6 CRITICALs; declarative pipeline run NON-FUNCTIONAL" for this area —',
      'test whether that is still true on the current branch, and say what was fixed.',
      'Then: how much of a claim-level index pipeline is already built here versus still to write?',
    ].join('\n'),
  },
  {
    label: 'fcdp-draft-consumer',
    brief: [
      'Read crates/archon-draft/ IN FULL, and ' + CF + '/plans/fable-console-drafting-protocol-v2.md',
      'and ' + CF + '/plans/fcdp-archon-port-plan*.md.',
      'The user states the FCDP drafting protocol pulls its quotations from archon. Establish exactly how:',
      'trace from pack assembly through to the quotations that reach a draft, naming every function.',
      'Establish precisely what provenance is CARRIED and what is DROPPED at each hop. Confirm or refute:',
      'QuoteEntry is {text, cite} with no chunk_id, no offsets, no bbox, no match_kind; Verification is a',
      'date plus a filename list; gp_validate never re-checks text against the source.',
      'Then: if the index became claim-level and lived in archon, what would the drafting protocol gain?',
      'Be concrete — what could a pack carry that it cannot carry today, and what gate could run that',
      'cannot run today? This agent establishes the VALUE side of the archon-first case.',
    ].join('\n'),
  },
  {
    label: 'corpus-adapter-cost',
    brief: [
      'The 27 hand-authored entries (1,758 files) live in ' + CF + '/corpus/index/ and are the irreplaceable',
      'asset. Establish what it costs to make them readable from archon.',
      'Survey the seven layout families and the actual file shapes (do not re-audit them exhaustively — a',
      'prior audit did; sample enough to size the work). Read',
      ' ' + CF + '/plans/archon-corpus-index-migration-spec.md IN FULL — it already mandates "import from',
      'SOURCE files, not compiled-index.json" and names 8 adapter families; assess whether that inventory',
      'is correct and complete against the real tree.',
      'Then estimate, with a stated basis: how many Rust adapters, how many lines, to read the entries into',
      'canonical claim/clause/edge/tension records? Note that 12 structured *-ontology.json files already',
      'exist and the incumbent compiler ignores them — how much does reading JSON instead of scraping',
      'markdown reduce the adapter burden? Quantify per entry.',
      'Also assess: does the corpus tree have to MOVE into archon-cli, or can archon read it in place across',
      'the repo boundary? What does archon assume about paths (check the --root / corpus_root handling)?',
    ].join('\n'),
  },
  {
    label: 'incumbent-compat-and-shim',
    brief: [
      'What breaks in ' + CF + ' if archon becomes the producer of the index?',
      'Enumerate every consumer of compiled-index.json in the incumbent: jsonl-loaders.ts:198-218,',
      'corpus-index-provider.ts, cross-author-utils.ts, smart-retrieval-layer.ts (:794-800 bypass),',
      'quality-integration.ts, write-pipeline-orchestrator.ts, gold-standard-prompt-builder.ts, cli.ts,',
      'retrieval-stage.ts. For EACH, state exactly which fields it reads.',
      'Then produce the LEGACY VIEW CONTRACT: the precise JSON archon would have to emit for every one of',
      'those consumers to keep working with zero TypeScript changes. Include field names, types, and any',
      'ordering or sort assumptions (note canonicalTerms is consumed by a greedy longest-match).',
      'Assess the risk in the other direction too: the incumbent has 157 tsc errors and zero tests on these',
      'modules — does that make a producer swap MORE or LESS risky? Argue it.',
      'Finally: is there an incremental path where BOTH producers run and their outputs are diffed, before',
      'anything is cut over? Specify it.',
    ].join('\n'),
  },
  {
    label: 'rust-velocity-and-repo-health',
    brief: [
      'An honest engineering-health comparison. Do not advocate; measure.',
      'For archon-cli: count crates, total Rust LOC (use find + wc), test files and test count, whether CI',
      'exists (.github/workflows), clippy state (there are branches named fix/wraith-clippy-remediation and',
      'backup/pre-clippy-remediation-2026-07-16 — read git log to find what that was about and whether it',
      'landed). Do NOT run cargo. Check git log for the last 30 commits: cadence, size, whether tests',
      'accompany features.',
      'For claudeflow-testing: the TS side has 157 tsc errors, no build, tsx transpile-only, zero tests on',
      'the index modules, and no CI referencing the compiler. Verify these independently.',
      'Then assess honestly: what is the real cost of working in Rust here versus Python/TypeScript for THIS',
      'specific work (schema definition, adapters over messy markdown/CSV, a validator, a query surface)?',
      'Where does Rust help (type-enforced schemas, exhaustive matching, a compiler that actually fails) and',
      'where does it hurt (iteration speed on adapters over irregular text, contributor friction)?',
      'State the honest downside of archon-first as clearly as the upside.',
    ].join('\n'),
  },
  {
    label: 'adversarial-critic',
    brief: [
      'You are the designated opponent. Build the STRONGEST possible case AGAINST implementing the index',
      'overhaul in archon-cli. Your verdict field should reflect the case you build, not a balanced view —',
      'other agents cover the favourable side.',
      'Lines of attack to investigate with evidence:',
      '  - The corpus, the entries, the plans, the drafting pipeline and the dissertation all live in',
      '    claudeflow-testing. Does archon-first create a permanent two-repo split with sync overhead?',
      '  - archon-cli has its own open work: feat/evidence-curation, feat/fcdp-draft,',
      '    feat/marker-server-parallel-ingest, clippy remediation, a coding-agent stack. Is there capacity?',
      '    Check git log dates for how active each is and whether anything is half-finished.',
      '  - Prior archon ports: read ' + CF + '/plans/ARCHON-PORT2-COMPLETE-2026-06-25.md,',
      '    ' + CF + '/plans/HANDOFF-archon-ingestion-port-2026-07-01.md,',
      '    ' + CF + '/plans/archon-ingestion-port-finish-plan-2026-06-30.md and any adoption-validation',
      '    document. Did previous ports land on time and complete? What went wrong? That is the best',
      '    available predictor and you should weight it heavily.',
      '  - Does the Rust type system actually help with irregular markdown adapters, or does it slow them?',
      '  - Is the user PhD-blocked on drafting? A months-long port that pauses dissertation progress is a',
      '    real cost. Look for evidence of the current drafting cadence and what depends on the index today.',
      '  - What is the cheapest thing that could possibly work instead? Argue that the two-field char-offset',
      '    change plus a quote-verification gate delivers most of the value in days, in the EXISTING split,',
      '    without any port at all.',
      'Be rigorous and fair-minded in your evidence even while arguing one side.',
    ].join('\n'),
  },
]

phase('Assess')

const assessed = await pipeline(
  SCOPES,
  (s) => agent(
    RULES + '\n\nYOUR SCOPE:\n' + s.brief + '\n\nReturn the structured object. Evidence or it did not happen.',
    { label: 'assess:' + s.label, phase: 'Assess', schema: SCHEMA }
  ),
  (res, s) => {
    if (!res || !res.findings) return { scope: s.label, result: res, verified: [] }
    const load = res.findings.filter((f) => f.bearing !== 'NEUTRAL' && f.confidence !== 'low').slice(0, 5)
    if (!load.length) return { scope: s.label, result: res, verified: [] }
    return parallel(
      load.map((f) => () =>
        agent(
          RULES + '\n\n' + [
            'ADVERSARIAL VERIFIER. Another agent makes this load-bearing claim about the archon-first',
            'proposal. Try to REFUTE it. Default to refuted=true unless you independently confirm it.',
            '',
            '  scope:    ' + s.label,
            '  bearing:  ' + f.bearing,
            '  claim:    ' + f.claim,
            '  evidence: ' + f.evidence,
            '',
            'Check for: a path or line that does not say what is claimed; a capability asserted from a',
            'struct definition that is never actually populated or called; an estimate with no basis; a',
            'comparison against a strawman version of the incumbent; a claim about archon that is true only',
            'on an unmerged branch; a cost that ignores the corpus, the drafting pipeline, or the user time.',
            'Open the files. Run read-only checks.',
          ].join('\n'),
          {
            label: 'verify:' + s.label.slice(0, 18),
            phase: 'Verify',
            schema: {
              type: 'object',
              required: ['refuted', 'reasoning', 'evidence_examined'],
              properties: {
                refuted: { type: 'boolean' },
                reasoning: { type: 'string' },
                evidence_examined: { type: 'string' },
                corrected_claim: { type: 'string' },
              },
            },
          }
        ).then((v) => ({ finding: f, verdict: v }))
      )
    ).then((vs) => ({ scope: s.label, result: res, verified: vs.filter(Boolean) }))
  }
)

phase('Decide')

const clean = assessed.filter(Boolean)
const verdicts = clean.map((c) => ({ scope: c.scope, verdict: c.result && c.result.archon_first_verdict, cost: c.result && c.result.port_cost }))
const allFindings = clean.flatMap((c) => ((c.result && c.result.findings) || []).map((f) => ({ scope: c.scope, ...f })))
const exists = clean.flatMap((c) => ((c.result && c.result.what_exists_already) || []).map((x) => '[' + c.scope + '] ' + x))
const missing = clean.flatMap((c) => ((c.result && c.result.what_is_missing) || []).map((x) => '[' + c.scope + '] ' + x))
const risks = clean.flatMap((c) => ((c.result && c.result.risks) || []).map((x) => '[' + c.scope + '] ' + x))
const vs = clean.flatMap((c) => c.verified || [])
const refuted = vs.filter((v) => v.verdict && v.verdict.refuted)

log('verdicts: ' + JSON.stringify(verdicts.map((v) => v.scope + '=' + v.verdict)) + ' | ' + refuted.length + ' of ' + vs.length + ' load-bearing claims refuted')

const synthesis = await agent(
  RULES + '\n\n' + [
    'You are deciding whether the claim/clause index overhaul should be implemented in archon-cli.',
    'Eight agents assessed it, including a designated opponent. Their load-bearing claims were then',
    'adversarially verified.',
    '',
    'PER-SCOPE VERDICTS AND COST ESTIMATES:',
    JSON.stringify(verdicts, null, 1).slice(0, 20000),
    '',
    'ALL FINDINGS (' + allFindings.length + '):',
    JSON.stringify(allFindings).slice(0, 150000),
    '',
    'ALREADY EXISTS IN ARCHON (' + exists.length + '):',
    exists.join('\n').slice(0, 50000),
    '',
    'MISSING, WOULD HAVE TO BE BUILT (' + missing.length + '):',
    missing.join('\n').slice(0, 50000),
    '',
    'RISKS (' + risks.length + '):',
    risks.join('\n').slice(0, 40000),
    '',
    'REFUTED LOAD-BEARING CLAIMS (' + refuted.length + ' of ' + vs.length + '):',
    refuted.map((v) => '[' + v.finding.bearing + '] ' + v.finding.claim + '\n    why refuted: ' + v.verdict.reasoning).join('\n').slice(0, 40000),
    '',
    'Produce a decision document in MARKDOWN. Be decisive; the user asked for a judgement, not a survey.',
    '',
    '## 1. Recommendation',
    'One paragraph. Archon-first, incumbent, or a specific hybrid. State it plainly and commit to it.',
    '',
    '## 2. The case for, ranked by force',
    'Only evidenced points. Each with path:line. Lead with the strongest.',
    '',
    '## 3. The case against, ranked by force',
    "Give the opponent's best arguments their full weight. Include the prior-port track record, since",
    'that is the best available predictor. Do not soften it.',
    '',
    '## 4. What refuted',
    'The load-bearing claims that did not survive verification, in both directions. Be honest — this',
    'section is what makes the recommendation trustworthy.',
    '',
    '## 5. What already exists versus what must be built',
    'Two columns, concrete, with path:line on the left and a sized estimate with its basis on the right.',
    'This is the heart of the cost question.',
    '',
    '## 6. The migration shape',
    'If archon-first (or hybrid) wins, specify it concretely:',
    '  - Does archon become the producer with compiled-index.json emitted as a legacy view? Give the',
    '    exact contract needed for the TypeScript consumers to keep working unchanged.',
    '  - Does the corpus tree move, or is it read in place across the repo boundary?',
    '  - What is the dual-run/diff period before any cutover?',
    '  - What is the very first commit, and what does it prove?',
    '',
    '## 7. The cheapest thing that could possibly work',
    'Independent of the port decision: what delivers the most value in the next week? The opponent argues',
    'this is the two-field char-offset change plus a match_kind-gated quote checker. Assess that claim',
    'seriously and say whether it is right.',
    '',
    '## 8. Sequenced recommendation',
    'A concrete order of work with sizes, marking what is reversible and what is a one-way door.',
  ].join('\n'),
  { label: 'decide:archon-first', phase: 'Decide', effort: 'high' }
)

return { scopes: clean.length, findings: allFindings.length, verified: vs.length, refuted: refuted.length, verdicts, synthesis }
