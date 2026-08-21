#!/usr/bin/env npx tsx
/**
 * ICP Pipeline Runner — Executes the full ICP pipeline with LLM claim generation
 *
 * Usage: cd /home/dalton/projects/claudeflow-testing && npx tsx scripts/icp-run.ts
 *
 * Prerequisites:
 *   - Embedding service at :8000
 *   - ChromaDB at :8001
 *   - Valid ANTHROPIC_API_KEY in .env
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
// CONFIGURATION
// =============================================================================

const PROMPT = `Articulate Aristotle's understanding of:
(a) motion (kinesis),
(b) time (chronos),
(c) the relationship between motion and time,
(d) and how aisthēsis and phantasia function within Aristotle's temporal framework.

Additionally, explicitly engage Heidegger's interpretation of Aristotle, drawing on Martin Heidegger, Basic Concepts of Aristotelian Philosophy (2009), including several verbatim quotations from that work, if relevant to Aristotle's concepts.

Target length: 1500-2000 words. Write as a single coherent section suitable for inclusion in a scholarly paper on Aristotle's philosophy of time and perception.`;

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
    { author: 'Aristotle', title: 'Physics' },
  ],
  secondarySources: [
    { author: 'Heidegger, Martin', title: 'Basic Concepts of Aristotelian Philosophy' },
  ],
  searchAll: true,
  corpusFolder: CORPUS_FOLDER,
};

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('=== ICP Pipeline Runner ===\n');

  // Verify API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 50) {
    console.error('ERROR: ANTHROPIC_API_KEY not found or too short (need 50+ chars)');
    console.error(`  Found key length: ${apiKey?.length ?? 0}`);
    process.exit(1);
  }
  console.log(`API key: ...${apiKey.slice(-8)} (${apiKey.length} chars)`);

  // Verify embedding service
  try {
    const embRes = await fetch('http://localhost:8000/');
    const embStatus = await embRes.json() as any;
    console.log(`Embedding: ${embStatus.status} (${embStatus.model})`);
  } catch (e) {
    console.error('ERROR: Embedding service not reachable at :8000');
    process.exit(1);
  }

  // Build SmartRetrievalLayer
  console.log(`\nCorpus folder: ${CORPUS_FOLDER}`);
  const retrieval = new SmartRetrievalLayer({
    chromaUrl: 'http://localhost:8001',
    embeddingUrl: 'http://localhost:8000',
    collectionName: 'knowledge_chunks',
    defaultMaxChunks: 40,
    defaultMinRelevance: 0.35,
    corpusFolder: CORPUS_FOLDER,
  });

  // Build providers via factory
  console.log('Building pipeline providers...');
  const factoryResult = await ICPProviderFactory.create(retrieval, {
    anthropicApiKey: apiKey,
    styleProfileId: 'dalton-academic-mkn82c3v',
    collections: [CORPUS_FOLDER],
    minRelevance: 0.35,
  });

  console.log(`Available backends: ${factoryResult.availableBackends.join(', ')}`);
  console.log(`ClaimProvider wired: ${!!factoryResult.deps.claimProvider}`);

  // Configure orchestrator
  const config: ICPOrchestratorConfig = {
    ...factoryResult.orchestratorConfig,
    defaultAtomsMode: 'analytics',
    styleProfileId: 'dalton-academic-mkn82c3v',
  };

  const orchestrator = new ICPOrchestrator(factoryResult.deps, config);

  // Run pipeline
  console.log('\n--- Running ICP Pipeline ---\n');
  console.log(`Prompt: ${PROMPT.slice(0, 120)}...`);
  console.log('');

  console.log(`Source priority: primary=[${SOURCE_PRIORITY.primarySources.map(s => s.author + ' - ' + s.title).join(', ')}], secondary=[${SOURCE_PRIORITY.secondarySources.map(s => s.author + ' - ' + s.title).join(', ')}], searchAll=${SOURCE_PRIORITY.searchAll}`);

  const startMs = Date.now();
  const result = await orchestrator.run(PROMPT, SOURCE_SCOPE, SOURCE_PRIORITY);
  const elapsedMs = Date.now() - startMs;

  // Report results
  console.log(`\n--- Pipeline Complete (${(elapsedMs / 1000).toFixed(1)}s) ---\n`);
  console.log(`Success: ${result.success}`);
  console.log(`Block reasons: ${result.blockReasons.length}`);
  console.log(`Quote spans: ${result.session.quote_spans.length}`);
  console.log(`Claims: ${result.session.claim_map?.claims.length ?? 0}`);
  console.log(`Atoms: ${result.session.atoms.length}`);
  console.log(`Bindings: ${result.session.bindings.length}`);
  console.log(`Hypothesis claims: ${result.session.hypothesis_claims.length}`);
  console.log(`Paragraphs planned: ${result.session.paragraph_plan.length}`);
  console.log(`Generated text sections: ${result.session.generated_text.size}`);
  console.log(`Events: ${result.session.event_log.length}`);

  // Quality gates
  const qg = result.session.quality_gates;
  if (qg) {
    console.log('\nQuality Gates:');
    if (qg.citation_enforcement) {
      console.log(`  Citation enforcement: ${qg.citation_enforcement.passed ? 'PASS' : 'FAIL'} (${qg.citation_enforcement.corrections} corrections, ${qg.citation_enforcement.hallucinations_caught} hallucinations caught)`);
    }
    if (qg.gauntlet) {
      console.log(`  Quality gauntlet: ${qg.gauntlet.passed ? 'PASS' : 'FAIL'} (score: ${qg.gauntlet.overall_score.toFixed(2)}, ${qg.gauntlet.stages_passed}/${qg.gauntlet.total_stages} stages)`);
    }
    if (qg.endnotes) {
      console.log(`  Endnotes: ${qg.endnotes.total} generated`);
    }
    if (qg.bibliography) {
      console.log(`  Bibliography: ${qg.bibliography.sources_count} sources`);
    }
    if (qg.style_profile) {
      console.log(`  Style profile: ${qg.style_profile.id} (applied: ${qg.style_profile.applied})`);
    }
  }

  // Pipeline metrics
  const pm = result.session.pipeline_metrics;
  if (pm) {
    console.log('\nPipeline Metrics:');
    if (pm.retrieval) {
      console.log(`  Cross-encoder: ${pm.retrieval.crossEncoder.available ? 'available' : 'unavailable'} (${pm.retrieval.crossEncoder.spansReranked} reranked)`);
      console.log(`  MMR: ${pm.retrieval.mmr.totalSelected}/${pm.retrieval.mmr.totalCandidates} selected`);
    }
    if (pm.ranking) {
      console.log(`  Ranking: ${pm.ranking.spanSignals.length} signals, ${pm.ranking.totalClusters} clusters`);
    }
    if (pm.embedding) {
      console.log(`  Embeddings: span cache ${pm.embedding.spanCacheSize}, facet cache ${pm.embedding.facetCacheSize}`);
    }
    if (pm.bindingQuality) {
      console.log(`  Binding quality: ${pm.bindingQuality.totalAssessed} assessed, ${pm.bindingQuality.totalDemoted} demoted, avg: ${pm.bindingQuality.avgOverall.toFixed(2)}`);
    }
  }

  // Export
  const prose = result.exportPackage?.final_prose ?? '';
  const endnotes = result.exportPackage?.endnotes ?? '';
  const bibliography = result.exportPackage?.bibliography ?? '';
  const wordCount = prose.split(/\s+/).filter(Boolean).length;
  console.log(`\nFinal prose: ${wordCount} words`);

  // Save output
  const outDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outPath = path.join(outDir, `icp-output-${timestamp}.md`);

  const fullDocument = [
    `# ICP Pipeline Output`,
    ``,
    `**Prompt:** ${PROMPT.split('\n')[0]}...`,
    `**Generated:** ${new Date().toISOString()}`,
    `**Corpus:** ${CORPUS_FOLDER}`,
    `**Primary sources:** ${SOURCE_PRIORITY.primarySources.map(s => s.author + ' - ' + s.title).join(', ')}`,
    `**Secondary sources:** ${SOURCE_PRIORITY.secondarySources.map(s => s.author + ' - ' + s.title).join(', ')}`,
    `**Search all:** ${SOURCE_PRIORITY.searchAll}`,
    `**Word count:** ${wordCount}`,
    `**Pipeline time:** ${(elapsedMs / 1000).toFixed(1)}s`,
    `**Claims:** ${result.session.claim_map?.claims.length ?? 0}`,
    `**Atoms:** ${result.session.atoms.length}`,
    `**Bindings:** ${result.session.bindings.length}`,
    `**Quote spans:** ${result.session.quote_spans.length}`,
    ``,
    `---`,
    ``,
    prose,
    ``,
    endnotes ? `\n${endnotes}\n` : '',
    bibliography ? `\n${bibliography}\n` : '',
  ].join('\n');

  fs.writeFileSync(outPath, fullDocument);
  console.log(`\nSaved to: ${outPath}`);

  // Also print the prose
  console.log('\n========== GENERATED PROSE ==========\n');
  console.log(prose || '(empty)');
  if (endnotes) {
    console.log('\n' + endnotes);
  }
  if (bibliography) {
    console.log('\n' + bibliography);
  }
  console.log('\n=====================================\n');
}

main().catch(err => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
