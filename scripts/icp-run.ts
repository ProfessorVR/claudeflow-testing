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
import { resolveTitle } from '../src/god-agent/shared/cross-author-utils.js';

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

const PROMPT = `The role of phantasia and Erschlossenheit in disclosing the environment:
how Aristotle's account of phantasia in De Anima III.3 anticipates
Heidegger's concept of disclosedness (Erschlossenheit) in Being and Time.

Specifically address:
(a) How Aristotle's phantasia functions as the faculty that discloses appearances (phainomena),
(b) How Heidegger's Erschlossenheit structures the disclosure of Being-in-the-world,
(c) The structural parallel between these two modes of disclosure,
(d) Where the two frameworks diverge — Aristotle's faculty psychology vs. Heidegger's existential analytic.

Include verbatim quotations from both De Anima and Being and Time.
Target length: 1000-1500 words. Write as a single coherent section suitable for a doctoral dissertation.`;

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
    { author: 'Heidegger, Martin', title: 'Being and Time' },
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
    if ((qg as any).edge_coherence) {
      const ec = (qg as any).edge_coherence;
      console.log(`  Edge coherence: ${ec.score.toFixed(2)} (${ec.contradictions.length} contradictions)`);
    }
    if ((qg as any).tension_awareness) {
      const ta = (qg as any).tension_awareness;
      console.log(`  Tension awareness: ${ta.passed ? 'PASS' : 'FAIL'} (${ta.tensionsChecked} checked, ${ta.tensionsAcknowledged} acknowledged)`);
      if (ta.unacknowledgedTensions?.length > 0) {
        for (const t of ta.unacknowledgedTensions) {
          console.log(`    UNACK: [${t.tensionId}] ${t.nodeA} ↔ ${t.nodeB}`);
        }
      }
    }
    if ((qg as any).unanchored_edges) {
      const ue = (qg as any).unanchored_edges;
      console.log(`  Unanchored edges: ${ue.length} (reasoning edges not grounded in QuoteSpans)`);
      for (const e of ue.slice(0, 3)) {
        console.log(`    [${e.edgeId}] ${e.source} ${e.relation} ${e.target} — missing: ${e.missingConcepts.join(', ')}`);
      }
      if (ue.length > 3) console.log(`    ... and ${ue.length - 3} more`);
    }
  }

  // Bridge-enforced spans report
  const bridgeSpans = result.session.quote_spans.filter((s: any) =>
    s.source_anchor?.includes('(bridge-enforced)')
  );
  if (bridgeSpans.length > 0) {
    console.log(`\nBridge-enforced spans: ${bridgeSpans.length}`);
    for (const s of bridgeSpans) {
      console.log(`  [${s.verification_status}] ${s.source_anchor}: "${s.text.slice(0, 80)}..."`);
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

  // Parenthetical citation coverage diagnostic
  const sentences = prose.match(/[^.!?]+[.!?]+/g) || [];
  const citationRegex = /\([^)]*\d+[^)]*\)/;
  let citedSentences = 0;
  sentences.forEach(sentence => {
    if (citationRegex.test(sentence)) {
      citedSentences++;
    }
  });
  const coverage = sentences.length > 0 ? ((citedSentences / sentences.length) * 100).toFixed(1) : '0';
  console.log(`[Diagnostics] Parenthetical Citation Coverage: ${coverage}% (${citedSentences}/${sentences.length} sentences)`);

  // Title adherence diagnostic: extract all cited titles and verify against QuoteSpan sources
  const titleRegex = /\([^,()]+,\s*\*([^*]+)\*(?:,\s*[^()]+)?\)/g;
  const citedTitles = new Set<string>();
  let titleMatch;
  while ((titleMatch = titleRegex.exec(prose)) !== null) {
    citedTitles.add(titleMatch[1].trim());
  }

  // Title alias resolution — uses manifest-derived canonical tables (H-05)
  // resolveTitle() handles Latin/alternate forms (De Anima → On The Soul (De Anima))
  const resolveAlias = (title: string): string => {
    const resolved = resolveTitle(title);
    return resolved.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  };

  // Tier 1: Titles grounded in THIS RUN's retrieved QuoteSpans
  const groundedTitles = new Set<string>();
  for (const span of result.session.quote_spans) {
    const anchor = span.source_anchor || '';
    // Extract title from "Author - Title (bridge-enforced)" or "Author - Title" format
    const dashIdx = anchor.indexOf(' - ');
    if (dashIdx > 0) {
      let title = anchor.slice(dashIdx + 3).trim();
      // Strip "(bridge-enforced)" suffix if present
      title = title.replace(/\s*\(bridge-enforced\)\s*$/, '').trim();
      if (title) groundedTitles.add(title);
    }
    const meta = (span as any).metadata;
    if (meta?.title) groundedTitles.add(meta.title);
  }

  // Tier 2: Titles that exist in the corpus manifest (valid but not retrieved this run)
  const corpusTitles = new Set<string>(groundedTitles);
  for (const src of [...(SOURCE_PRIORITY.primarySources || []), ...(SOURCE_PRIORITY.secondarySources || [])]) {
    if (typeof src === 'object' && src.title) corpusTitles.add(src.title);
  }

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const matchesSet = (cited: string, titleSet: Set<string>) => {
    const resolvedCited = resolveAlias(cited);
    return [...titleSet].some(vt => {
      const resolvedValid = resolveAlias(vt);
      return resolvedValid.includes(resolvedCited) || resolvedCited.includes(resolvedValid)
        || normalize(vt).includes(normalize(cited)) || normalize(cited).includes(normalize(vt));
    });
  };

  const fullyGrounded: string[] = [];
  const ungroundedButCorpusValid: string[] = [];
  const fullyUnauthorized: string[] = [];

  for (const cited of citedTitles) {
    if (matchesSet(cited, groundedTitles)) {
      fullyGrounded.push(cited);
    } else if (matchesSet(cited, corpusTitles)) {
      ungroundedButCorpusValid.push(cited);
    } else {
      fullyUnauthorized.push(cited);
    }
  }

  if (citedTitles.size > 0) {
    const allValid = fullyUnauthorized.length === 0;
    const strictAdherence = ((fullyGrounded.length / citedTitles.size) * 100).toFixed(0);
    const looseAdherence = (((fullyGrounded.length + ungroundedButCorpusValid.length) / citedTitles.size) * 100).toFixed(0);
    console.log(`[Diagnostics] Title Adherence: ${allValid ? 'PASS' : 'FAIL'} | grounded=${strictAdherence}% corpus-valid=${looseAdherence}% (${fullyGrounded.length} grounded, ${ungroundedButCorpusValid.length} corpus-valid-ungrounded, ${fullyUnauthorized.length} unauthorized out of ${citedTitles.size})`);
    if (ungroundedButCorpusValid.length > 0) {
      for (const t of ungroundedButCorpusValid) {
        console.log(`  UNGROUNDED (corpus-valid): *${t}*`);
      }
    }
    if (fullyUnauthorized.length > 0) {
      for (const t of fullyUnauthorized) {
        console.log(`  UNAUTHORIZED (hallucinated): *${t}*`);
      }
    }
  } else {
    console.log(`[Diagnostics] Title Adherence: N/A (no italic-title citations found)`);
  }
}

main()
  .then(() => {
    console.log('Exiting process successfully.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
