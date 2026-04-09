#!/usr/bin/env npx tsx
/**
 * ICP Multi-Prompt Validation Harness
 *
 * Runs the ICP pipeline against 4 prompt profiles (cross-author, single-author,
 * multi-author, secondary-scholarship) and writes a regression summary matrix
 * to tmp/prompt-regression-matrix.md.
 *
 * Usage: npx tsx scripts/icp-multi-prompt-test.ts [profile]
 *   profile: "all" (default), "cross", "single", "multi", "secondary"
 */

import * as fs from 'fs';
import * as path from 'path';
import { ICPOrchestrator, type ICPOrchestratorConfig } from '../src/god-agent/core/composition/icp-orchestrator.js';
import { ICPProviderFactory } from '../src/god-agent/core/composition/icp-provider-factory.js';
import { SmartRetrievalLayer } from '../src/god-agent/retrieval/smart-retrieval-layer.js';
import type { SourceScopeSpec, SourcePriorityConfig } from '../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// ENV LOADER
// =============================================================================

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (value) process.env[key] = value;
  }
}

// =============================================================================
// PROMPT PROFILES
// =============================================================================

interface PromptProfile {
  name: string;
  prompt: string;
  primarySources: Array<{ author: string; title: string }>;
  secondarySources: Array<{ author: string; title: string }>;
}

const PROFILES: Record<string, PromptProfile> = {
  cross: {
    name: 'Cross-Author (Aristotle + Heidegger)',
    prompt: `The role of phantasia and Erschlossenheit in disclosing the environment:
how Aristotle's account of phantasia in De Anima III.3 anticipates
Heidegger's concept of disclosedness (Erschlossenheit) in Being and Time.
Target length: 800-1200 words.`,
    primarySources: [
      { author: 'Aristotle', title: 'On The Soul (De Anima)' },
      { author: 'Heidegger, Martin', title: 'Being and Time' },
    ],
    secondarySources: [
      { author: 'Heidegger, Martin', title: 'Basic Concepts of Aristotelian Philosophy' },
    ],
  },
  single: {
    name: 'Single-Author (Aristotle only)',
    prompt: `Aristotle's account of kinesis (motion) in the Physics:
how does Aristotle distinguish kinesis from energeia, and what role does
the concept of dynamis (potentiality) play in his analysis of change?
Target length: 800-1200 words.`,
    primarySources: [
      { author: 'Aristotle', title: 'Physics' },
      { author: 'Aristotle', title: 'Metaphysics' },
    ],
    secondarySources: [],
  },
  multi: {
    name: 'Multi-Author (Burke + Rickert + Heidegger)',
    prompt: `The concept of rhetorical attunement across three traditions:
how Burke's dramatism, Rickert's ambient rhetoric, and Heidegger's Befindlichkeit
converge on the idea that rhetorical engagement is fundamentally a mode of being-attuned.
Target length: 800-1200 words.`,
    primarySources: [
      { author: 'Burke, Kenneth', title: 'A Grammar of Motives' },
      { author: 'Rickert, Thomas', title: 'Ambient Rhetoric- The Attunements of Rhetorical Being' },
      { author: 'Heidegger, Martin', title: 'Being and Time' },
    ],
    secondarySources: [],
  },
  secondary: {
    name: 'Secondary Scholarship (Phantasia commentary)',
    prompt: `Scholarly debate on the cognitive role of phantasia in Aristotle:
compare the interpretations of Frede, Caston, and Nussbaum regarding whether
phantasia constitutes a distinct cognitive faculty or a mode of sensory processing.
Target length: 800-1200 words.`,
    primarySources: [
      { author: 'Aristotle', title: 'On The Soul (De Anima)' },
    ],
    secondarySources: [
      { author: 'Frede, Dorothea', title: 'The Cognitive Role of Phantasia in Aristotle' },
      { author: 'Caston, Victor', title: 'Why Aristotle Needs Imagination' },
      { author: 'Nussbaum, Martha', title: 'The Role of Phantasia in Aristotle\'s Explanation of Action' },
    ],
  },
};

const CORPUS_FOLDER = 'rhetorical_ontology';

// =============================================================================
// RUNNER
// =============================================================================

interface RunResult {
  profile: string;
  claims: number;
  atoms: number;
  bindings: number;
  sections: number;
  citations: string;
  titleGrounded: string;
  titleCorpusValid: string;
  unauthorized: number;
  edgeCoherence: string;
  tensionAwareness: string;
  conflictEvents: number;
  unanchoredEdges: number;
  bridgeSpans: number;
  elapsed: string;
}

async function runProfile(profile: PromptProfile): Promise<RunResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const retrieval = new SmartRetrievalLayer({
    chromaUrl: 'http://localhost:8001',
    embeddingUrl: 'http://localhost:8000',
    collectionName: 'knowledge_chunks',
    defaultMaxChunks: 40,
    defaultMinRelevance: 0.35,
    corpusFolder: CORPUS_FOLDER,
  });

  const factoryResult = await ICPProviderFactory.create(retrieval, {
    anthropicApiKey: apiKey,
    styleProfileId: 'dalton-academic-mkn82c3v',
    collections: [CORPUS_FOLDER],
    minRelevance: 0.35,
  });

  const config: ICPOrchestratorConfig = {
    ...factoryResult.orchestratorConfig,
    defaultAtomsMode: 'analytics',
    styleProfileId: 'dalton-academic-mkn82c3v',
  };

  const orchestrator = new ICPOrchestrator(factoryResult.deps, config);
  const sourceScope: SourceScopeSpec = {
    mode: 'corpus',
    corpus_config: { collections: [CORPUS_FOLDER], min_relevance: 0.35, max_chunks: 40 },
  };
  const sourcePriority: SourcePriorityConfig = {
    primarySources: profile.primarySources,
    secondarySources: profile.secondarySources,
    searchAll: true,
    corpusFolder: CORPUS_FOLDER,
  };

  const startMs = Date.now();
  const result = await orchestrator.run(profile.prompt, sourceScope, sourcePriority);
  const elapsedMs = Date.now() - startMs;

  const prose = result.exportPackage?.final_prose ?? Array.from(result.session.generated_text.values()).join('\n\n');
  const qg = result.session.quality_gates;

  // Citation coverage
  const sentences = prose.match(/[^.!?]+[.!?]+/g) || [];
  const citationRegex = /\([^)]*\d+[^)]*\)/;
  const citedSentences = sentences.filter(s => citationRegex.test(s)).length;
  const coverage = sentences.length > 0 ? ((citedSentences / sentences.length) * 100).toFixed(1) : '0';

  // Title adherence
  const titleRegex = /\([^,()]+,\s*\*([^*]+)\*(?:,\s*[^()]+)?\)/g;
  const citedTitles = new Set<string>();
  let m;
  while ((m = titleRegex.exec(prose)) !== null) citedTitles.add(m[1].trim());
  const unauthorizedCount = [...citedTitles].filter(t => {
    // Simple check: does the title contain a substring of any source priority title?
    const allTitles = [...profile.primarySources, ...profile.secondarySources].map(s => s.title.toLowerCase());
    const tLower = t.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    return !allTitles.some(at => at.toLowerCase().includes(tLower) || tLower.includes(at.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()));
  }).length;

  const bridgeSpans = result.session.quote_spans.filter((s: any) => s.source_anchor?.includes('(bridge-enforced)')).length;

  return {
    profile: profile.name,
    claims: result.session.claim_map?.claims.length ?? 0,
    atoms: result.session.atoms.length,
    bindings: result.session.bindings.length,
    sections: result.session.generated_text.size,
    citations: `${coverage}% (${citedSentences}/${sentences.length})`,
    titleGrounded: `${citedTitles.size - unauthorizedCount}/${citedTitles.size}`,
    titleCorpusValid: unauthorizedCount === 0 ? 'PASS' : 'FAIL',
    unauthorized: unauthorizedCount,
    edgeCoherence: (qg as any)?.edge_coherence?.score?.toFixed(2) ?? 'N/A',
    tensionAwareness: (qg as any)?.tension_awareness?.passed ? 'PASS' : ((qg as any)?.tension_awareness ? 'FAIL' : 'N/A'),
    conflictEvents: (qg as any)?.author_conflict_events?.length ?? 0,
    unanchoredEdges: (qg as any)?.unanchored_edges?.length ?? 0,
    bridgeSpans,
    elapsed: `${(elapsedMs / 1000).toFixed(0)}s`,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const selected = process.argv[2] || 'all';
  const profileKeys = selected === 'all'
    ? Object.keys(PROFILES)
    : [selected];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 50) {
    console.error('ERROR: ANTHROPIC_API_KEY not found');
    process.exit(1);
  }

  // Verify services
  try {
    await fetch('http://localhost:8000/');
    await fetch('http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections');
  } catch {
    console.error('ERROR: Embedding or ChromaDB not reachable');
    process.exit(1);
  }

  console.log(`=== ICP Multi-Prompt Validation ===`);
  console.log(`Profiles: ${profileKeys.join(', ')}\n`);

  const results: RunResult[] = [];

  for (const key of profileKeys) {
    const profile = PROFILES[key];
    if (!profile) { console.error(`Unknown profile: ${key}`); continue; }

    console.log(`--- Running: ${profile.name} ---`);
    console.log(`Prompt: ${profile.prompt.split('\n')[0]}...`);

    try {
      const result = await runProfile(profile);
      results.push(result);
      console.log(`  Claims: ${result.claims} | Atoms: ${result.atoms} | Bindings: ${result.bindings} | Sections: ${result.sections}`);
      console.log(`  Citations: ${result.citations} | Titles: ${result.titleGrounded} | Edge: ${result.edgeCoherence} | ${result.elapsed}`);
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      results.push({
        profile: profile.name, claims: 0, atoms: 0, bindings: 0, sections: 0,
        citations: 'FAILED', titleGrounded: 'FAILED', titleCorpusValid: 'FAILED',
        unauthorized: 0, edgeCoherence: 'FAILED', tensionAwareness: 'FAILED',
        conflictEvents: 0, unanchoredEdges: 0, bridgeSpans: 0, elapsed: 'FAILED',
      });
    }
    console.log('');
  }

  // Write regression matrix
  const matrixPath = path.resolve('tmp', 'prompt-regression-matrix.md');
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const header = `| Profile | Claims | Atoms | Bindings | Sections | Citations | Titles | Unauthorized | Edge Coh. | Tension | Conflicts | Unanchored | Bridges | Time |`;
  const separator = `|---------|--------|-------|----------|----------|-----------|--------|-------------|-----------|---------|-----------|------------|---------|------|`;

  let existing = '';
  if (fs.existsSync(matrixPath)) {
    existing = fs.readFileSync(matrixPath, 'utf-8');
  }

  const rows = results.map(r =>
    `| ${r.profile} | ${r.claims} | ${r.atoms} | ${r.bindings} | ${r.sections} | ${r.citations} | ${r.titleGrounded} | ${r.unauthorized} | ${r.edgeCoherence} | ${r.tensionAwareness} | ${r.conflictEvents} | ${r.unanchoredEdges} | ${r.bridgeSpans} | ${r.elapsed} |`
  );

  const newBlock = `\n## Run: ${timestamp}\n\n${header}\n${separator}\n${rows.join('\n')}\n`;

  if (!existing) {
    fs.writeFileSync(matrixPath, `# ICP Prompt Regression Matrix\n${newBlock}`);
  } else {
    fs.appendFileSync(matrixPath, newBlock);
  }

  console.log(`\nRegression matrix written to: ${matrixPath}`);
  console.log(`\n=== Summary ===`);
  console.log(header);
  console.log(separator);
  for (const row of rows) console.log(row);
}

main()
  .then(() => { process.exit(0); })
  .catch(err => {
    console.error('Multi-prompt test failed:', err);
    process.exit(1);
  });
