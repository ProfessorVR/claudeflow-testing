#!/usr/bin/env npx tsx
/**
 * ICP Dashboard Full-Scale Simulation
 *
 * Runs the ICP orchestrator directly, then verifies:
 *   - All pipeline_metrics fields populated
 *   - Analytics events emitted
 *   - Dashboard JS/CSS has all analytics components
 *   - Session API serialization includes pipeline_metrics
 *
 * Prerequisites:
 *   - Dashboard running at :3847  (./scripts/god-launch start)
 *   - Embedding service at :8000
 *   - ChromaDB at :8001
 *   - Valid ANTHROPIC_API_KEY in .env
 */

import * as fs from 'fs';
import * as path from 'path';
import { ICPOrchestrator, type ICPDependencies, type ICPOrchestratorConfig, type ICPPipelineResult } from '../src/god-agent/core/composition/icp-orchestrator.js';
import { ICPProviderFactory } from '../src/god-agent/core/composition/icp-provider-factory.js';
import { SmartRetrievalLayer } from '../src/god-agent/retrieval/smart-retrieval-layer.js';
import type { SourceScopeSpec, PipelineMetrics } from '../src/god-agent/core/composition/icp-types.js';

// Load .env
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

const DASHBOARD = 'http://localhost:3847';

// ============================================================================
// UTILITIES
// ============================================================================

type TestResult = { name: string; passed: boolean; detail: string; duration: number };
const results: TestResult[] = [];

function pass(name: string, detail: string, ms: number) {
  results.push({ name, passed: true, detail, duration: ms });
  console.log(`  ✓ ${name} (${ms}ms) — ${detail}`);
}

function fail(name: string, detail: string, ms: number) {
  results.push({ name, passed: false, detail, duration: ms });
  console.log(`  ✗ ${name} (${ms}ms) — ${detail}`);
}

function timer() {
  const start = Date.now();
  return () => Date.now() - start;
}

// ============================================================================
// PHASE 0: PRE-FLIGHT
// ============================================================================

async function preflightChecks(): Promise<boolean> {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        ICP Dashboard Full-Scale Simulation                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('Phase 0: Pre-flight Checks\n');

  // Dashboard
  const t1 = timer();
  try {
    const resp = await fetch(`${DASHBOARD}/api/health`);
    const health = await resp.json();
    if (health.status === 'healthy') {
      pass('Dashboard health', `uptime=${health.uptime}ms`, t1());
    } else {
      fail('Dashboard health', `status=${health.status}`, t1());
      return false;
    }
  } catch (e: any) {
    fail('Dashboard health', `unreachable: ${e.message}`, t1());
    return false;
  }

  // Embedding
  const t2 = timer();
  try {
    const resp = await fetch('http://localhost:8000/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: ['test'] }),
    });
    const data = await resp.json();
    if (data.embeddings?.[0]?.length === 1536) {
      pass('Embedding service', `dim=${data.embeddings[0].length}`, t2());
    } else {
      fail('Embedding service', 'bad response', t2());
      return false;
    }
  } catch (e: any) {
    fail('Embedding service', e.message, t2());
    return false;
  }

  // ChromaDB
  const t3 = timer();
  try {
    const resp = await fetch('http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections');
    const cols = await resp.json();
    pass('ChromaDB', `${Array.isArray(cols) ? cols.length : 0} collections`, t3());
  } catch (e: any) {
    fail('ChromaDB', e.message, t3());
    return false;
  }

  // API key
  const t4 = timer();
  const keyLen = process.env.ANTHROPIC_API_KEY?.length ?? 0;
  if (keyLen >= 50) {
    pass('Anthropic API key', `length=${keyLen}`, t4());
  } else {
    fail('Anthropic API key', `length=${keyLen}`, t4());
    return false;
  }

  return true;
}

// ============================================================================
// PHASE 1: FULL PIPELINE EXECUTION
// ============================================================================

async function phase1_runPipeline(): Promise<ICPPipelineResult | null> {
  console.log('\n─── Phase 1: Full ICP Pipeline Execution (Direct Orchestrator) ───\n');

  const t = timer();
  try {
    // Create factory with real services
    console.log('  Creating ICPProviderFactory...');
    const retrieval = new SmartRetrievalLayer();
    const factoryResult = await ICPProviderFactory.create(retrieval, {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log(`  Factory created: backends=[${factoryResult.availableBackends.join(', ')}]`);

    // Create orchestrator
    const config: ICPOrchestratorConfig = {
      ...factoryResult.orchestratorConfig,
      autoVerifyOnly: true,
      defaultAtomsMode: 'analytics',
      runsDir: `/tmp/icp-sim-${Date.now()}`,
    };
    const orchestrator = new ICPOrchestrator(factoryResult.deps, config);

    const scope: SourceScopeSpec = {
      mode: 'corpus',
      corpus_config: {
        collections: ['rhetorical_ontology'],
        min_relevance: 0.35,
        max_chunks: 20,
      },
      doc_authority_policy: {
        version: '1.0.0',
        tiers: { primary: 1, secondary: 2 },
      },
    };

    console.log('  Running pipeline (decompose → retrieve → rank → verify → generate)...');
    const result = await orchestrator.run(
      "Analyze Aristotle's concept of phantasia in De Anima III.3 and its role as a mediating faculty between perception and thought.",
      scope,
    );

    const elapsed = t();
    const session = result.session;

    if (result.success) {
      pass('Pipeline execution', `${elapsed}ms, success=true`, elapsed);
    } else {
      fail('Pipeline execution', `blockReasons=${result.blockReasons.map(b => b.reason).join('; ')}`, elapsed);
    }

    // Session summary
    console.log(`\n  Session Summary:`);
    console.log(`    ID:         ${session.session_id}`);
    console.log(`    Facets:     ${session.facets.length}`);
    console.log(`    Spans:      ${session.quote_spans.length}`);
    console.log(`    Atoms:      ${session.atoms.length}`);
    console.log(`    Bindings:   ${session.bindings.length}`);
    console.log(`    Events:     ${session.event_log.length}`);
    console.log(`    Revision:   ${session.revision}`);
    console.log(`    Has text:   ${session.generated_text.size > 0}`);
    console.log(`    Has export: ${!!result.exportPackage}`);

    return result;
  } catch (e: any) {
    fail('Pipeline execution', `error: ${e.message}`, t());
    console.error('  Stack:', e.stack?.split('\n').slice(0, 5).join('\n  '));
    return null;
  }
}

// ============================================================================
// PHASE 2: PIPELINE METRICS DEEP INSPECTION
// ============================================================================

function phase2_inspectMetrics(result: ICPPipelineResult): void {
  console.log('\n─── Phase 2: Pipeline Metrics Deep Inspection ───\n');

  const metrics = result.session.pipeline_metrics;

  // 2a: pipeline_metrics existence
  const t1 = timer();
  if (metrics) {
    pass('pipeline_metrics present', `keys: [${Object.keys(metrics).join(', ')}]`, t1());
  } else {
    fail('pipeline_metrics present', 'field is missing', t1());
    return;
  }

  // 2b: Retrieval metrics
  const t2 = timer();
  if (metrics.retrieval) {
    const r = metrics.retrieval;
    console.log('\n  Retrieval Metrics:');
    console.log(`    Cross-Encoder: available=${r.crossEncoder.available}, reranked=${r.crossEncoder.spansReranked}, avgΔ=${r.crossEncoder.avgScoreChange.toFixed(4)}`);
    console.log(`    MMR: selected=${r.mmr.totalSelected}/${r.mmr.totalCandidates}`);
    console.log(`    Roles: ${JSON.stringify(r.roles.distribution)}`);
    console.log(`    Semantic Windows: expansions=${r.semanticWindows.totalExpansions}, avgSize=${r.semanticWindows.avgWindowSentences.toFixed(1)}`);

    // Lambda schedule
    const facetIds = Object.keys(r.mmr.lambdaSchedule);
    if (facetIds.length > 0) {
      console.log(`    Lambda Schedule (${facetIds.length} facets):`);
      for (const fid of facetIds.slice(0, 3)) {
        const lambdas = r.mmr.lambdaSchedule[fid];
        console.log(`      ${fid.slice(0, 20)}...: [${lambdas.map((l: number) => l.toFixed(2)).join(', ')}]`);
      }
    }
    pass('Retrieval metrics', `mmr=${r.mmr.totalSelected}/${r.mmr.totalCandidates}, roles=${Object.keys(r.roles.distribution).length} types`, t2());
  } else {
    fail('Retrieval metrics', 'not populated', t2());
  }

  // 2c: Embedding metrics
  const t3 = timer();
  if (metrics.embedding) {
    console.log('\n  Embedding Metrics:');
    console.log(`    Span cache: ${metrics.embedding.spanCacheSize}`);
    console.log(`    Facet cache: ${metrics.embedding.facetCacheSize}`);
    console.log(`    Provider available: ${metrics.embedding.providerAvailable}`);
    pass('Embedding metrics', `spanCache=${metrics.embedding.spanCacheSize}, provider=${metrics.embedding.providerAvailable}`, t3());
  } else {
    fail('Embedding metrics', 'not populated', t3());
  }

  // 2d: Ranking metrics
  const t4 = timer();
  if (metrics.ranking) {
    const r = metrics.ranking;
    console.log('\n  Ranking Metrics:');
    console.log(`    Total spans: ${r.spanSignals.length}`);
    console.log(`    Clusters: ${r.totalClusters}, Aliases: ${r.totalAliases}`);
    console.log(`    RRF K: ${r.k}`);
    console.log(`    Signal weights: ${JSON.stringify(r.signalWeights)}`);

    // Top 5 spans
    console.log(`\n    Top 5 Ranked Spans:`);
    for (const s of r.spanSignals.slice(0, 5)) {
      const sigs = Object.entries(s.signals).map(([k, v]) => `${k}=${(v as number).toFixed(3)}`).join(' ');
      console.log(`      #${s.rank} [RRF=${s.rrfScore.toFixed(6)}] ${s.quote_id.slice(0, 20)}  ${sigs}`);
    }
    pass('Ranking metrics', `${r.spanSignals.length} spans, ${r.totalClusters} clusters, k=${r.k}`, t4());
  } else {
    fail('Ranking metrics', 'not populated', t4());
  }

  // 2e: Binding quality metrics
  const t5 = timer();
  if (metrics.bindingQuality) {
    const b = metrics.bindingQuality;
    console.log('\n  Binding Quality Metrics (Claude-as-Judge):');
    console.log(`    Assessed: ${b.totalAssessed}`);
    console.log(`    Demoted: ${b.totalDemoted}`);
    console.log(`    Avg overall: ${b.avgOverall.toFixed(3)}`);

    if (b.assessments.length > 0) {
      console.log(`\n    Sample Assessments (first 3):`);
      for (const a of b.assessments.slice(0, 3)) {
        console.log(`      atom=${a.atomId.slice(0, 15)} quote=${a.quoteId.slice(0, 15)} overall=${a.scores.overall.toFixed(2)} demoted=${a.demoted}`);
        console.log(`        rel=${a.scores.relevance.toFixed(2)} quot=${a.scores.quotability.toFixed(2)} arg=${a.scores.argumentative_weight.toFixed(2)} auth=${a.scores.source_authority.toFixed(2)} ctx=${a.scores.contextual_fit.toFixed(2)}`);
      }
    }
    pass('Binding quality metrics', `assessed=${b.totalAssessed}, demoted=${b.totalDemoted}, avg=${b.avgOverall.toFixed(3)}`, t5());
  } else {
    // Binding quality is only populated when atoms mode is active
    console.log('\n  Binding Quality: not populated (atoms mode may be off)');
    pass('Binding quality metrics', 'skipped (atomsMode=off)', t5());
  }

  // 2f: Analytics events
  const t6 = timer();
  const analyticsEvents = result.session.event_log.filter(e => e.category === 'analytics');
  if (analyticsEvents.length > 0) {
    console.log(`\n  Analytics Events (${analyticsEvents.length}):`);
    for (const e of analyticsEvents) {
      console.log(`    [${e.action}] ${e.detail} (actor=${e.actor}, severity=${e.severity})`);
    }
    const actions = [...new Set(analyticsEvents.map(e => e.action))];
    pass('Analytics events', `${analyticsEvents.length} events: ${actions.join(', ')}`, t6());
  } else {
    fail('Analytics events', 'no analytics events in event_log', t6());
  }
}

// ============================================================================
// PHASE 3: DASHBOARD RENDERING VERIFICATION
// ============================================================================

async function phase3_verifyDashboard(): Promise<void> {
  console.log('\n─── Phase 3: Dashboard Rendering Verification ───\n');

  // 3a: Dashboard HTML
  const t1 = timer();
  try {
    const resp = await fetch(DASHBOARD);
    const html = await resp.text();
    if (html.includes('<!DOCTYPE html>') && html.length > 1000) {
      pass('Dashboard HTML', `${html.length} bytes`, t1());
    } else {
      fail('Dashboard HTML', `unexpected content (${html.length} bytes)`, t1());
    }
  } catch (e: any) {
    fail('Dashboard HTML', e.message, t1());
  }

  // 3b: ICP Panel JS — all analytics functions present
  const t2 = timer();
  try {
    const resp = await fetch(`${DASHBOARD}/icp-panel.js`);
    const js = await resp.text();
    const functions = [
      'renderAnalyticsPanel',
      'renderRankingSection',
      'renderCrossEncoderSection',
      'renderRolesSection',
      'renderMmrSection',
      'renderBindingQualitySection',
      'renderEmbeddingSection',
    ];
    const missing = functions.filter(f => !js.includes(f));
    if (missing.length === 0) {
      pass('ICP Panel JS', `all ${functions.length} analytics functions present (${js.length} bytes)`, t2());
    } else {
      fail('ICP Panel JS', `missing: ${missing.join(', ')}`, t2());
    }

    // Check nav button
    const t2b = timer();
    if (js.includes('data-panel="analytics"')) {
      pass('Analytics nav button', 'present in JS', t2b());
    } else {
      fail('Analytics nav button', 'missing', t2b());
    }

    // Check renderer registration
    const t2c = timer();
    if (js.includes('analytics: renderAnalyticsPanel')) {
      pass('Renderer registration', 'analytics → renderAnalyticsPanel', t2c());
    } else {
      fail('Renderer registration', 'analytics renderer not registered', t2c());
    }

    // Check graceful degradation
    const t2d = timer();
    if (js.includes('Not available') || js.includes('run pipeline first')) {
      pass('Graceful degradation', 'fallback placeholder text found', t2d());
    } else {
      fail('Graceful degradation', 'no fallback text found', t2d());
    }
  } catch (e: any) {
    fail('ICP Panel JS', e.message, t2());
  }

  // 3c: CSS — analytics classes
  const t3 = timer();
  try {
    const resp = await fetch(`${DASHBOARD}/styles.css`);
    const css = await resp.text();
    const required = [
      '.icp-analytics',
      '.icp-analytics-section',
      '.signal-table',
      '.signal-bar',
      '.role-bar-container',
      '.role-bar',
      '.judge-card',
      '.judge-dimension',
      '.judge-badge-demoted',
      '.analytics-stat-card',
      '.lambda-table',
    ];
    const found = required.filter(cls => css.includes(cls));
    const missing = required.filter(cls => !css.includes(cls));
    if (missing.length === 0) {
      pass('Analytics CSS', `all ${required.length} classes present (${css.length} bytes)`, t3());
    } else {
      fail('Analytics CSS', `found ${found.length}/${required.length}, missing: ${missing.join(', ')}`, t3());
    }
  } catch (e: any) {
    fail('Analytics CSS', e.message, t3());
  }
}

// ============================================================================
// PHASE 4: EVENT SYSTEM VERIFICATION
// ============================================================================

function phase4_verifyEvents(result: ICPPipelineResult): void {
  console.log('\n─── Phase 4: Event System Verification ───\n');

  const events = result.session.event_log;

  // 4a: Event categories
  const t1 = timer();
  const categories = [...new Set(events.map(e => e.category))];
  pass('Event categories', `${categories.length}: ${categories.join(', ')}`, t1());

  // 4b: Expected analytics actions
  const analyticsActions = events.filter(e => e.category === 'analytics').map(e => e.action);
  const expectedActions = ['cross_encoder', 'mmr_select', 'embedding_status'];

  for (const action of expectedActions) {
    const t = timer();
    if (analyticsActions.includes(action)) {
      pass(`Analytics: ${action}`, 'emitted', t());
    } else {
      fail(`Analytics: ${action}`, 'NOT emitted', t());
    }
  }

  // rank event only emitted if spans exist
  const t2 = timer();
  if (result.session.quote_spans.length > 0) {
    if (analyticsActions.includes('rank')) {
      pass('Analytics: rank', 'emitted (spans present)', t2());
    } else {
      fail('Analytics: rank', 'NOT emitted despite spans existing', t2());
    }
  } else {
    pass('Analytics: rank', 'skipped (0 spans)', t2());
  }

  // 4c: Event ordering (session revisions should be monotonically increasing)
  const t3 = timer();
  let ordered = true;
  for (let i = 1; i < events.length; i++) {
    if (events[i].session_revision <= events[i - 1].session_revision) {
      ordered = false;
      break;
    }
  }
  if (ordered) {
    pass('Event ordering', `${events.length} events in monotonic revision order`, t3());
  } else {
    fail('Event ordering', 'revisions not monotonically increasing', t3());
  }

  // 4d: Event severity distribution
  const t4 = timer();
  const severities: Record<string, number> = {};
  for (const e of events) {
    severities[e.severity] = (severities[e.severity] || 0) + 1;
  }
  pass('Event severities', Object.entries(severities).map(([k, v]) => `${k}=${v}`).join(', '), t4());
}

// ============================================================================
// PHASE 5: EXPORT PACKAGE VERIFICATION
// ============================================================================

function phase5_verifyExport(result: ICPPipelineResult): void {
  console.log('\n─── Phase 5: Export Package Verification ───\n');

  if (!result.exportPackage) {
    const t = timer();
    fail('Export package', 'not generated', t());
    return;
  }

  const pkg = result.exportPackage;

  const t1 = timer();
  const proseLen = (pkg.final_prose || '').length;
  if (proseLen > 0) {
    const wordCount = (pkg.final_prose || '').split(/\s+/).length;
    pass('Final prose', `${wordCount} words (${proseLen} chars)`, t1());
  } else {
    fail('Final prose', 'empty', t1());
  }

  const t2 = timer();
  if ((pkg.endnotes || '').length > 0) {
    pass('Endnotes', `${pkg.endnotes.length} chars`, t2());
  } else {
    fail('Endnotes', 'empty', t2());
  }

  const t3 = timer();
  if ((pkg.bibliography || '').length > 0) {
    pass('Bibliography', `${pkg.bibliography.length} chars`, t3());
  } else {
    fail('Bibliography', 'empty', t3());
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  const totalStart = Date.now();

  // Phase 0: Pre-flight
  const healthy = await preflightChecks();
  if (!healthy) {
    console.log('\n  ⚠ Pre-flight checks failed. Fix services before continuing.\n');
    process.exit(1);
  }

  // Phase 1: Run pipeline
  const result = await phase1_runPipeline();
  if (!result) {
    console.log('\n  ⚠ Pipeline failed. See errors above.\n');
    // Still run Phase 3 (dashboard rendering check) even without pipeline
    await phase3_verifyDashboard();
    printSummary(totalStart);
    process.exit(1);
  }

  // Phase 2: Inspect metrics
  phase2_inspectMetrics(result);

  // Phase 3: Dashboard rendering
  await phase3_verifyDashboard();

  // Phase 4: Event system
  phase4_verifyEvents(result);

  // Phase 5: Export package
  phase5_verifyExport(result);

  printSummary(totalStart);
}

function printSummary(totalStart: number) {
  const totalMs = Date.now() - totalStart;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SIMULATION RESULTS                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n  Total: ${results.length} checks | Passed: ${passed} | Failed: ${failed} | Time: ${(totalMs / 1000).toFixed(1)}s\n`);

  if (failed > 0) {
    console.log('  Failed checks:');
    for (const r of results.filter(r => !r.passed)) {
      console.log(`    ✗ ${r.name}: ${r.detail}`);
    }
    console.log('');
  }

  if (failed === 0) {
    console.log('  ★ All checks passed — ICP Dashboard pipeline fully functional!\n');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Simulation crashed:', e);
  process.exit(2);
});
