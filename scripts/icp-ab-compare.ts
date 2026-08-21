#!/usr/bin/env npx tsx
/**
 * ICP A/B Comparison — Basic vs Enriched SuperPrompt
 *
 * Runs the ICP pipeline once through stages 1-7 (shared), then generates
 * text twice: once with basic prompts (passthrough), once with enriched
 * superprompts. Outputs both side-by-side for quality comparison.
 *
 * Usage: cd /home/dalton/projects/claudeflow-testing && npx tsx scripts/icp-ab-compare.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { ICPOrchestrator, type ICPOrchestratorConfig } from '../src/god-agent/core/composition/icp-orchestrator.js';
import { ICPProviderFactory } from '../src/god-agent/core/composition/icp-provider-factory.js';
import { SmartRetrievalLayer } from '../src/god-agent/retrieval/smart-retrieval-layer.js';
import { ConstrainedGenerator, type SuperPromptSessionContext } from '../src/god-agent/core/composition/constrained-generator.js';
import type {
  SourceScopeSpec,
  SourcePriorityConfig,
  ICPSession,
  DiscourseState,
  SuperPrompt,
} from '../src/god-agent/core/composition/icp-types.js';

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
// CONFIGURATION — ~1000 word target
// =============================================================================

const PROMPT = `Articulate Aristotle's understanding of phantasia (imagination) as presented in De Anima III.3. Specifically address:
(a) How phantasia is distinguished from both perception (aisthēsis) and thought (noēsis),
(b) The role of phantasia in Aristotle's psychology of action,
(c) How Heidegger interprets Aristotle's phantasia in Basic Concepts of Aristotelian Philosophy (2009).

Target length: 800-1000 words. Write as a single coherent section suitable for a scholarly paper.`;

const CORPUS_FOLDER = 'rhetorical_ontology';

const SOURCE_SCOPE: SourceScopeSpec = {
  mode: 'corpus',
  corpus_config: {
    collections: [CORPUS_FOLDER],
    min_relevance: 0.35,
    max_chunks: 40,
  },
  doc_authority_policy: {
    version: '1.0.0',
    tiers: { primary: 1, secondary: 2, tertiary: 3 },
  },
};

const SOURCE_PRIORITY: SourcePriorityConfig = {
  primarySources: [
    { author: 'Aristotle', title: 'On The Soul (De Anima)' },
  ],
  secondarySources: [
    { author: 'Heidegger, Martin', title: 'Basic Concepts of Aristotelian Philosophy' },
  ],
  searchAll: true,
  corpusFolder: CORPUS_FOLDER,
};

// =============================================================================
// HELPERS
// =============================================================================

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function buildSessionContext(session: ICPSession): SuperPromptSessionContext {
  return {
    writing_contract: session.writing_contract ? {
      thesis: session.writing_contract.thesis,
      scope: session.writing_contract.scope,
      audience: session.writing_contract.audience,
      section_outline: session.writing_contract.section_outline?.map(s => ({
        section_id: s.section_id,
        title: s.title,
        facet_ids: s.facet_ids,
      })),
    } : undefined,
    stress_test_report: session.stress_test_report,
    facets: session.facets,
    claims: session.claim_map?.claims?.map((c: any) => ({
      id: c.id,
      claim: c.claim,
      warrant: c.warrant,
      backing: c.backing,
      qualification: c.qualification,
      rebuttal: c.rebuttal,
    })),
    prompt_spec: session.prompt_spec ? {
      research_questions: session.prompt_spec.research_questions,
      success_criteria: session.prompt_spec.success_criteria,
    } : undefined,
    binding_quality: session.pipeline_metrics?.bindingQuality?.assessments?.map((a: any) => ({
      atomId: a.atomId,
      quoteId: a.quoteId,
      scores: { overall: a.scores?.overall ?? 0 },
    })),
    paragraph_plan: session.paragraph_plan,
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   ICP A/B COMPARISON: Basic vs Enriched SuperPrompt ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Verify API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 50) {
    console.error('ERROR: ANTHROPIC_API_KEY not found or too short');
    process.exit(1);
  }
  console.log(`API key: ...${apiKey.slice(-8)} (${apiKey.length} chars)`);

  // Verify embedding
  try {
    const embRes = await fetch('http://localhost:8000/');
    const embStatus = await embRes.json() as any;
    console.log(`Embedding: ${embStatus.status} (${embStatus.model})`);
  } catch {
    console.error('ERROR: Embedding service not reachable at :8000');
    process.exit(1);
  }

  // Build retrieval + providers
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

  console.log(`Backends: ${factoryResult.availableBackends.join(', ')}`);
  console.log(`ClaimProvider: ${!!factoryResult.deps.claimProvider}`);

  const config: ICPOrchestratorConfig = {
    ...factoryResult.orchestratorConfig,
    defaultAtomsMode: 'analytics',
    styleProfileId: 'dalton-academic-mkn82c3v',
  };

  // =========================================================================
  // PHASE 1: Run full pipeline (stages 1-11) — this is the BASIC (A) run
  // =========================================================================
  console.log('\n═══ PHASE 1: Running full pipeline (Basic / A) ═══\n');

  const orchestratorA = new ICPOrchestrator(factoryResult.deps, config);
  const startA = Date.now();
  const resultA = await orchestratorA.run(PROMPT, SOURCE_SCOPE, SOURCE_PRIORITY);
  const elapsedA = Date.now() - startA;

  const sessionA = resultA.session;
  const proseA = resultA.exportPackage?.final_prose ?? '';
  const wordsA = countWords(proseA);

  console.log(`Pipeline A done in ${(elapsedA / 1000).toFixed(1)}s`);
  console.log(`  Quotes: ${sessionA.quote_spans.length}`);
  console.log(`  Claims: ${sessionA.claim_map?.claims?.length ?? 0}`);
  console.log(`  Atoms: ${sessionA.atoms.length}`);
  console.log(`  Bindings: ${sessionA.bindings.length}`);
  console.log(`  Stress report: ${sessionA.stress_test_report?.summary?.total_tested ?? 0} tested`);
  console.log(`  Writing contract: ${sessionA.writing_contract ? 'YES' : 'NO'}`);
  console.log(`  Paragraphs: ${sessionA.paragraph_plan.length}`);
  console.log(`  Words: ${wordsA}`);

  // =========================================================================
  // PHASE 2: Enriched SuperPrompt (B) — use same session state, regenerate
  // =========================================================================
  console.log('\n═══ PHASE 2: Enriched SuperPrompt generation (B) ═══\n');

  // Build enriched superprompts from session A's state
  const generator = new ConstrainedGenerator();
  const sessionContext = buildSessionContext(sessionA);

  // Show what enrichment data is available
  console.log('Enrichment data available:');
  console.log(`  Thesis: ${sessionContext.writing_contract?.thesis ? 'YES' : 'NO'}`);
  console.log(`  Facets: ${sessionContext.facets.length}`);
  console.log(`  Stress report: ${sessionContext.stress_test_report?.atom_results?.length ?? 0} results`);
  console.log(`  Claims (Toulmin): ${sessionContext.claims?.length ?? 0}`);
  console.log(`  Binding quality: ${sessionContext.binding_quality?.length ?? 0}`);
  console.log(`  Prompt spec: ${sessionContext.prompt_spec ? 'YES' : 'NO'}`);

  let discourse: DiscourseState = {
    last_paragraph_tail: [],
    transitions_used_so_far: [],
    rhetorical_goal: '',
    section_argument_trajectory: '',
  };

  const sortedPlan = [...sessionA.paragraph_plan].sort(
    (a, b) => a.paragraph_order - b.paragraph_order,
  );

  const enrichedPrompts: SuperPrompt[] = [];
  for (const entry of sortedPlan) {
    const { systemPrompt, userPrompt, enrichmentManifest, enrichmentData } = generator.assembleSuperPrompt(
      entry,
      sessionA.atoms,
      sessionA.bindings,
      sessionA.quote_spans,
      discourse,
      'analytics',
      sessionA.style_prompt,
      sessionContext,
    );

    console.log(`  P${entry.paragraph_order + 1}: ${enrichmentManifest.applied_count}/8 enrichments (~${enrichmentManifest.total_token_estimate} tokens)`);
    for (const e of enrichmentManifest.entries) {
      const status = e.applied ? '✓' : '✗';
      console.log(`    ${status} ${e.label}: ${e.applied ? e.summary : e.skip_reason}`);
    }

    enrichedPrompts.push({
      paragraph_id: entry.paragraph_id,
      paragraph_order: entry.paragraph_order,
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      atom_ids: entry.atom_ids,
      quote_ids: entry.required_quotes || [],
      citation_keys: [],
      assembled_at: new Date().toISOString(),
      executed: false,
      enrichment_manifest: enrichmentManifest,
      enrichment_data: enrichmentData,
    });
  }

  // Generate text for each enriched superprompt using the same LLM provider
  console.log('\nGenerating enriched paragraphs...');
  const startB = Date.now();
  const generatedB: string[] = [];

  for (const sp of enrichedPrompts) {
    try {
      const text = await factoryResult.deps.generationProvider.generateParagraph(
        sp.user_prompt,
        sp.system_prompt,
      );
      generatedB.push(text);
    } catch (err: any) {
      console.error(`  Failed P${sp.paragraph_order + 1}: ${err.message}`);
      generatedB.push('[GENERATION FAILED]');
    }
  }
  const elapsedB = Date.now() - startB;

  const proseB = generatedB.join('\n\n');
  const wordsB = countWords(proseB);
  console.log(`Generation B done in ${(elapsedB / 1000).toFixed(1)}s, ${wordsB} words`);

  // =========================================================================
  // PHASE 3: Output comparison
  // =========================================================================
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║              A/B COMPARISON RESULTS             ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  console.log(`                    A (Basic)     B (Enriched)`);
  console.log(`  Words:            ${String(wordsA).padEnd(14)} ${wordsB}`);
  console.log(`  Generation time:  ${(elapsedA / 1000).toFixed(1)}s (full)   ${(elapsedB / 1000).toFixed(1)}s (gen only)`);
  console.log(`  Paragraphs:       ${String(sortedPlan.length).padEnd(14)} ${generatedB.length}`);

  // Save both outputs
  const outDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // -- Document A --
  const docA = [
    '# A/B Comparison — Version A (Basic SuperPrompt)',
    '',
    `**Prompt:** ${PROMPT.split('\n')[0]}`,
    `**Generated:** ${new Date().toISOString()}`,
    `**Word count:** ${wordsA}`,
    `**Pipeline time:** ${(elapsedA / 1000).toFixed(1)}s`,
    `**Enrichments:** None (passthrough)`,
    '',
    '---',
    '',
    proseA,
    '',
    resultA.exportPackage?.endnotes ? `\n${resultA.exportPackage.endnotes}\n` : '',
    resultA.exportPackage?.bibliography ? `\n${resultA.exportPackage.bibliography}\n` : '',
  ].join('\n');

  // -- Document B --
  const enrichmentSummary = enrichedPrompts.map(sp => {
    const m = sp.enrichment_manifest;
    return `P${sp.paragraph_order + 1}: ${m?.applied_count ?? 0}/8 enrichments`;
  }).join(', ');

  const docB = [
    '# A/B Comparison — Version B (Enriched SuperPrompt)',
    '',
    `**Prompt:** ${PROMPT.split('\n')[0]}`,
    `**Generated:** ${new Date().toISOString()}`,
    `**Word count:** ${wordsB}`,
    `**Generation time:** ${(elapsedB / 1000).toFixed(1)}s`,
    `**Enrichments:** ${enrichmentSummary}`,
    `**Thesis injected:** ${sessionContext.writing_contract?.thesis ?? 'N/A'}`,
    '',
    '---',
    '',
    proseB,
  ].join('\n');

  const pathA = path.join(outDir, `ab-A-basic-${timestamp}.md`);
  const pathB = path.join(outDir, `ab-B-enriched-${timestamp}.md`);

  fs.writeFileSync(pathA, docA);
  fs.writeFileSync(pathB, docB);

  console.log(`\nSaved:`);
  console.log(`  A (Basic):    ${pathA}`);
  console.log(`  B (Enriched): ${pathB}`);

  // Print both
  console.log('\n' + '='.repeat(72));
  console.log('  VERSION A — BASIC SUPERPROMPT');
  console.log('='.repeat(72) + '\n');
  console.log(proseA || '(empty)');

  console.log('\n' + '='.repeat(72));
  console.log('  VERSION B — ENRICHED SUPERPROMPT');
  console.log('='.repeat(72) + '\n');
  console.log(proseB || '(empty)');

  console.log('\n' + '='.repeat(72));
  console.log('  ENRICHMENT DETAILS');
  console.log('='.repeat(72) + '\n');

  // Print enrichment details for inspection
  if (sessionContext.writing_contract) {
    console.log(`Thesis: "${sessionContext.writing_contract.thesis}"`);
    console.log(`Scope: "${sessionContext.writing_contract.scope}"`);
    console.log(`Audience: "${sessionContext.writing_contract.audience}"`);
  }

  if (sessionA.stress_test_report) {
    const sr = sessionA.stress_test_report.summary;
    console.log(`\nStress Test: ${sr.total_tested} tested, ${sr.passed} passed, ${sr.warned} warned, ${sr.failed} failed`);
    for (const r of sessionA.stress_test_report.atom_results) {
      if (r.warrant_verdict !== 'adequate' || r.contested) {
        const atom = sessionA.atoms.find(a => a.atom_id === r.atom_id);
        console.log(`  [${r.warrant_verdict}${r.contested ? '+contested' : ''}] ${atom?.display_text ?? r.atom_id}`);
      }
    }
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('A/B comparison failed:', err);
  process.exit(1);
});
