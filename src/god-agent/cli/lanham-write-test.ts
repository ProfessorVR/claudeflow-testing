#!/usr/bin/env npx tsx
/**
 * Lanham-Integrated Write Pipeline Test Harness
 *
 * Runs 8 logged stages to validate the full Lanham write pipeline:
 *   1. Profile pre-flight
 *   2. Hard pre-flight (ChromaDB + embedding service)
 *   3. Soft retrieval probe
 *   4. Style prompt check
 *   5. Draft generation
 *   6. Post-generation Lanham analysis
 *   7. Drift detection
 *   8. Save artifacts
 *
 * Usage:
 *   npx tsx src/god-agent/cli/lanham-write-test.ts \
 *     --topic "Lanham's AT/THROUGH distinction..." \
 *     --genre academic \
 *     --profile dalton-academic-mkn82c3v \
 *     [--prefetched chunks.json | --corpus-live] \
 *     [--strict] \
 *     [--verbose]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, join } from 'path';

// ── .env loader (same pattern as tmp/lanham-write-test-prefetched.ts) ──────
try {
  const envPath = resolve(process.cwd(), '.env');
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* .env not found — rely on shell environment */ }

// ── CLI argument parsing ───────────────────────────────────────────────────
import { Command } from 'commander';

const program = new Command();
program
  .name('lanham-write-test')
  .description('Test harness for the Lanham-integrated write pipeline')
  .version('1.0.0')
  .requiredOption('--topic <text>', 'Writing topic / prompt text')
  .option('--genre <genre>', 'Genre context', 'academic')
  .option('--profile <id>', 'Style profile ID', 'dalton-academic-mkn82c3v')
  .option('--prefetched <file>', 'Path to pre-fetched chunks JSON')
  .option('--corpus-live', 'Use live corpus retrieval via UniversalAgent')
  .option('--strict', 'Fail (not warn) on zero retrieval results')
  .option('--verbose', 'Extra logging detail')
  .parse();

const opts = program.opts<{
  topic: string;
  genre: string;
  profile: string;
  prefetched?: string;
  corpusLive?: boolean;
  strict?: boolean;
  verbose?: boolean;
}>();

// ── Types ──────────────────────────────────────────────────────────────────
type StageResult = 'PASS' | 'FAIL' | 'WARN' | 'INFO';

interface RetrievalStats {
  queryCount: number;
  chunkCount: number;
  scoreRange: [number, number] | null;
}

interface ManifestData {
  topic: string;
  profile: string;
  genre: string;
  collection: string;
  timestamp: string;
  retrieval: RetrievalStats;
  generation: {
    wordCount: number;
    inputTokens: number;
    outputTokens: number;
    elapsedMs: number;
  } | null;
  lanhamAnalysis: Record<string, string> | null;
  drift: string[];
  outputFile: string;
}

// ── Logging helpers ────────────────────────────────────────────────────────
function logStage(n: number, name: string, result: StageResult, msg: string) {
  const icon = result === 'PASS' ? 'PASS' : result === 'FAIL' ? 'FAIL' : result === 'WARN' ? 'WARN' : 'INFO';
  console.log(`\n[Stage ${n}/8] ${name}  ${icon}: ${msg}`);
}

function logDetail(msg: string) {
  console.log(`  ${msg}`);
}

// ── Main harness ───────────────────────────────────────────────────────────
async function main() {
  console.log('=== LANHAM WRITE PIPELINE TEST HARNESS ===');
  console.log(`Topic:   ${opts.topic.substring(0, 80)}${opts.topic.length > 80 ? '...' : ''}`);
  console.log(`Genre:   ${opts.genre}`);
  console.log(`Profile: ${opts.profile}`);
  console.log(`Mode:    ${opts.prefetched ? 'prefetched' : opts.corpusLive ? 'corpus-live' : 'prefetched (default)'}`);
  if (opts.strict) console.log('Strict:  enabled');
  console.log('');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const COLLECTION = 'v2_knowledge_chunks';

  let profileData: any = null;
  let profile: any = null;
  let generatedText = '';
  let generationStats: ManifestData['generation'] = null;
  let lanhamLabels: Record<string, string> | null = null;
  let driftAxes: string[] = [];
  let retrievalStats: RetrievalStats = { queryCount: 0, chunkCount: 0, scoreRange: null };
  let blocked = false;

  // ── Stage 1: Profile pre-flight ────────────────────────────────────────
  try {
    const profilePath = resolve(process.cwd(), '.agentdb/universal/style-profiles.json');
    if (!existsSync(profilePath)) {
      logStage(1, 'Profile pre-flight', 'FAIL', `Profile file not found: ${profilePath}`);
      blocked = true;
    } else {
      profileData = JSON.parse(readFileSync(profilePath, 'utf-8'));
      profile = profileData.profiles[opts.profile];
      if (!profile) {
        logStage(1, 'Profile pre-flight', 'FAIL', `Profile "${opts.profile}" not found in profiles file`);
        blocked = true;
      } else {
        const hasLanhamMetrics = !!profile.characteristics?.lanhamMetrics;
        const hasAnalyzerTier = !!profile.metadata?.lanhamAnalyzerTier;
        const hasTarget = !!profile.characteristics?.lanhamMetrics?.suggestedLanhamTarget ||
                          !!profile.metadata?.suggestedLanhamTarget;

        if (!hasLanhamMetrics) {
          logStage(1, 'Profile pre-flight', 'FAIL', 'Profile lacks lanhamMetrics');
          blocked = true;
        } else {
          const details = [
            `lanhamMetrics: ${hasLanhamMetrics ? 'present' : 'MISSING'}`,
            `lanhamAnalyzerTier: ${hasAnalyzerTier ? profile.metadata.lanhamAnalyzerTier : 'MISSING'}`,
            `suggestedLanhamTarget: ${hasTarget ? 'available' : 'not set'}`,
          ];
          logStage(1, 'Profile pre-flight', 'PASS', 'Profile loaded with Lanham data');
          for (const d of details) logDetail(d);
          if (opts.verbose && profile.characteristics.lanhamMetrics.labels) {
            logDetail(`Labels: ${JSON.stringify(profile.characteristics.lanhamMetrics.labels)}`);
          }
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logStage(1, 'Profile pre-flight', 'FAIL', `Error loading profile: ${msg}`);
    blocked = true;
  }

  // ── Stage 2: Hard pre-flight ───────────────────────────────────────────
  const chromaPort = process.env.CHROMA_PORT || '8001';
  const embeddingPort = process.env.EMBEDDING_PORT || '8000';
  const chromaUrl = `http://localhost:${chromaPort}`;
  const embeddingUrl = `http://localhost:${embeddingPort}`;

  try {
    // ChromaDB heartbeat
    const chromaResp = await fetch(`${chromaUrl}/api/v2/heartbeat`);
    if (!chromaResp.ok) {
      logStage(2, 'Hard pre-flight', 'FAIL', `ChromaDB heartbeat failed (HTTP ${chromaResp.status})`);
      blocked = true;
    } else {
      // Embedding service
      const embResp = await fetch(`${embeddingUrl}/`);
      if (!embResp.ok) {
        logStage(2, 'Hard pre-flight', 'FAIL', `Embedding service unreachable (HTTP ${embResp.status})`);
        blocked = true;
      } else {
        // Resolve collection UUID
        const collResp = await fetch(
          `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections`
        );
        if (!collResp.ok) {
          logStage(2, 'Hard pre-flight', 'FAIL', `Failed to list collections (HTTP ${collResp.status})`);
          blocked = true;
        } else {
          const collections = await collResp.json() as any[];
          const v2Coll = collections.find((c: any) => c.name === COLLECTION);
          if (!v2Coll) {
            logStage(2, 'Hard pre-flight', 'FAIL', `Collection "${COLLECTION}" not found`);
            blocked = true;
          } else {
            logStage(2, 'Hard pre-flight', 'PASS', `Services online, collection UUID: ${v2Coll.id}`);
            if (opts.verbose) {
              logDetail(`ChromaDB: ${chromaUrl}`);
              logDetail(`Embedding: ${embeddingUrl}`);
              logDetail(`Collections found: ${collections.length}`);
            }
          }
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logStage(2, 'Hard pre-flight', 'FAIL', `Service check error: ${msg}`);
    blocked = true;
  }

  if (blocked) {
    console.log('\n*** BLOCKED: Hard pre-flight failed. Cannot continue. ***');
    process.exit(1);
  }

  // ── Stage 3: Soft retrieval probe ──────────────────────────────────────
  try {
    const { SmartRetrievalLayer } = await import('../retrieval/smart-retrieval-layer.js');
    const retrieval = new SmartRetrievalLayer();
    const sentinelQuery = opts.topic.substring(0, 100);
    const results = await retrieval.retrieveContext(sentinelQuery, {
      maxChunks: 5,
      minRelevance: 0.0,
    });

    retrievalStats = {
      queryCount: 1,
      chunkCount: results.length,
      scoreRange: results.length > 0
        ? [
            Math.min(...results.map((r: any) => r.relevanceScore ?? r.score ?? 0)),
            Math.max(...results.map((r: any) => r.relevanceScore ?? r.score ?? 0)),
          ]
        : null,
    };

    if (results.length === 0) {
      if (opts.strict) {
        logStage(3, 'Soft retrieval probe', 'FAIL', 'Zero chunks returned (strict mode)');
        process.exit(1);
      } else {
        logStage(3, 'Soft retrieval probe', 'WARN', 'Zero chunks returned — generation may lack grounding');
      }
    } else {
      const range = retrievalStats.scoreRange!;
      logStage(3, 'Soft retrieval probe', 'PASS', `${results.length} chunks, score range [${range[0].toFixed(3)}, ${range[1].toFixed(3)}]`);
      if (opts.verbose) {
        for (const r of results.slice(0, 3)) {
          const score = r.relevanceScore ?? 0;
          const text = (r.content || '').substring(0, 80);
          logDetail(`  [${score.toFixed(3)}] ${text}...`);
        }
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (opts.strict) {
      logStage(3, 'Soft retrieval probe', 'FAIL', `Retrieval error: ${msg}`);
      process.exit(1);
    } else {
      logStage(3, 'Soft retrieval probe', 'WARN', `Retrieval error (non-blocking): ${msg}`);
    }
  }

  // ── Stage 4: Style prompt check ────────────────────────────────────────
  let stylePrompt = '';
  try {
    const { StyleAnalyzer } = await import('../universal/style-analyzer.js');
    const analyzer = new StyleAnalyzer();
    stylePrompt = analyzer.generateStylePrompt(profile.characteristics);
    const hasLanhamBlock = stylePrompt.includes('PROSE STYLE DIMENSIONS (Lanham Framework)');

    if (hasLanhamBlock) {
      logStage(4, 'Style prompt check', 'PASS', 'Lanham Framework block present in style prompt');
      if (opts.verbose) {
        const lines = stylePrompt.split('\n');
        const start = lines.findIndex(l => l.includes('PROSE STYLE DIMENSIONS'));
        if (start >= 0) {
          logDetail('--- Lanham block preview ---');
          for (let i = start; i < Math.min(start + 8, lines.length); i++) {
            logDetail(lines[i]);
          }
          logDetail('---');
        }
      }
    } else {
      logStage(4, 'Style prompt check', 'FAIL', 'Lanham Framework block MISSING from style prompt');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logStage(4, 'Style prompt check', 'FAIL', `Error generating style prompt: ${msg}`);
  }

  // ── Stage 5: Draft generation ──────────────────────────────────────────
  const startTime = Date.now();
  try {
    if (opts.prefetched) {
      // Prefetched mode: load chunks, call Anthropic directly
      const chunksPath = resolve(process.cwd(), opts.prefetched);
      if (!existsSync(chunksPath)) {
        logStage(5, 'Draft', 'FAIL', `Prefetched chunks file not found: ${chunksPath}`);
      } else {
        const chunks = JSON.parse(readFileSync(chunksPath, 'utf-8'));
        logDetail(`Loaded ${chunks.length} pre-fetched chunks`);

        const corpusContext = chunks.map((c: any, i: number) => {
          const meta = c.metadata || {};
          return `[SOURCE ${i + 1}] (${meta.author_raw || 'Unknown'}, ${meta.title_raw || 'Unknown'}, pp. ${meta.page_start || '?'}-${meta.page_end || '?'})\n${(c.text || c.content || '').substring(0, 800)}`;
        }).join('\n\n');

        const systemPrompt = `You are an academic writing assistant. Write in the learned style described below.

${stylePrompt}

## CORPUS EVIDENCE (use ONLY these sources for claims)
${corpusContext}

## WRITING TASK
${opts.topic}

CRITICAL CONSTRAINTS:
- Every substantive claim must cite a specific source from the corpus evidence above.
- Use parenthetical citations.
- Do not invent or hallucinate sources.
- Write approximately 800 words.`;

        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic();
        const response = await client.messages.create({
          model: process.env.LANHAM_TEST_MODEL || 'claude-sonnet-4-6-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: 'Write the section now.' }],
        });

        const elapsed = Date.now() - startTime;
        generatedText = response.content[0].type === 'text' ? response.content[0].text : '';
        const wordCount = generatedText.split(/\s+/).filter(w => w.length > 0).length;
        generationStats = {
          wordCount,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          elapsedMs: elapsed,
        };

        logStage(5, 'Draft', 'PASS', `${wordCount} words in ${(elapsed / 1000).toFixed(1)}s`);
        logDetail(`Tokens: ${response.usage.input_tokens} in / ${response.usage.output_tokens} out`);
      }
    } else if (opts.corpusLive) {
      // Live corpus mode: use UniversalAgent.write()
      const { UniversalAgent } = await import('../universal/universal-agent.js');
      const agent = new UniversalAgent({
        verbose: opts.verbose,
      });
      await (agent as any).initialize?.();

      const result = await agent.write(opts.topic, {
        style: opts.genre as any,
        styleProfileId: opts.profile,
        useCorpus: true,
        length: 'medium',
        format: 'essay',
      });

      const elapsed = Date.now() - startTime;
      generatedText = typeof result === 'string' ? result : (result as any).text || (result as any).content || '';
      const wordCount = generatedText.split(/\s+/).filter(w => w.length > 0).length;
      generationStats = {
        wordCount,
        inputTokens: (result as any).usage?.input_tokens ?? 0,
        outputTokens: (result as any).usage?.output_tokens ?? 0,
        elapsedMs: elapsed,
      };

      logStage(5, 'Draft', 'PASS', `${wordCount} words in ${(elapsed / 1000).toFixed(1)}s (corpus-live)`);
      logDetail(`Tokens: ${generationStats.inputTokens} in / ${generationStats.outputTokens} out`);
    } else {
      logStage(5, 'Draft', 'INFO', 'No --prefetched or --corpus-live specified; skipping draft generation');
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logStage(5, 'Draft', 'FAIL', `Generation error: ${msg}`);
    if (opts.verbose && err instanceof Error && err.stack) {
      logDetail(err.stack);
    }
  }

  // ── Stage 6: Post-generation Lanham analysis ───────────────────────────
  if (generatedText.length > 0) {
    try {
      const { LanhamProseAnalyzer } = await import('./style/lanham-prose-analyzer.js');
      const lanhamAnalyzer = new LanhamProseAnalyzer(opts.genre as any);
      const metrics = await lanhamAnalyzer.fullAnalysis(generatedText);

      lanhamLabels = {
        nounVerb: metrics.labels.nounVerb,
        parataxisHypotaxis: metrics.labels.parataxisHypotaxis,
        periodicRunning: metrics.labels.periodicRunning,
        voice: metrics.labels.voice,
        primaryRegister: metrics.labels.primaryRegister,
        opacity: metrics.labels.opacity,
      };

      logStage(6, 'Post-generation Lanham analysis', 'PASS', 'Analysis complete');
      logDetail(`Noun/Verb:       ${lanhamLabels.nounVerb}`);
      logDetail(`Architecture:    ${lanhamLabels.parataxisHypotaxis}`);
      logDetail(`Sentence Shape:  ${lanhamLabels.periodicRunning}`);
      logDetail(`Voice:           ${lanhamLabels.voice}`);
      logDetail(`Register:        ${lanhamLabels.primaryRegister}`);
      logDetail(`Opacity:         ${lanhamLabels.opacity}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logStage(6, 'Post-generation Lanham analysis', 'FAIL', `Analysis error: ${msg}`);
    }
  } else {
    logStage(6, 'Post-generation Lanham analysis', 'INFO', 'No generated text to analyze');
  }

  // ── Stage 7: Drift detection ───────────────────────────────────────────
  if (lanhamLabels && profile?.characteristics?.lanhamMetrics?.labels) {
    const baseline = profile.characteristics.lanhamMetrics.labels;

    // Hard-constraint axes
    if (lanhamLabels.nounVerb !== baseline.nounVerb) {
      driftAxes.push(`nounVerb [HARD]: ${baseline.nounVerb} -> ${lanhamLabels.nounVerb}`);
    }
    if (lanhamLabels.primaryRegister !== baseline.primaryRegister) {
      driftAxes.push(`register [HARD]: ${baseline.primaryRegister} -> ${lanhamLabels.primaryRegister}`);
    }

    // Firm-guidance axis
    if (lanhamLabels.voice !== baseline.voice) {
      driftAxes.push(`voice [FIRM]: ${baseline.voice} -> ${lanhamLabels.voice}`);
    }

    // Soft-guidance axes (informational)
    if (lanhamLabels.parataxisHypotaxis !== baseline.parataxisHypotaxis) {
      driftAxes.push(`architecture [SOFT]: ${baseline.parataxisHypotaxis} -> ${lanhamLabels.parataxisHypotaxis}`);
    }
    if (lanhamLabels.opacity !== baseline.opacity) {
      driftAxes.push(`opacity [SOFT]: ${baseline.opacity} -> ${lanhamLabels.opacity}`);
    }

    if (driftAxes.length > 0) {
      logStage(7, 'Drift detection', 'WARN', `${driftAxes.length} axis drift(s) detected`);
      for (const d of driftAxes) logDetail(d);
    } else {
      logStage(7, 'Drift detection', 'PASS', 'No drift from baseline on any axis');
    }
  } else {
    logStage(7, 'Drift detection', 'INFO', 'Skipped — no generated metrics or baseline available');
  }

  // ── Stage 8: Save artifacts ────────────────────────────────────────────
  try {
    const manifestDir = resolve(process.cwd(), 'lanham-tests/manifests');
    const outputDir = resolve(process.cwd(), 'lanham-tests/outputs');
    mkdirSync(manifestDir, { recursive: true });
    mkdirSync(outputDir, { recursive: true });

    const outputFileName = `${timestamp}-output.md`;
    const outputFilePath = join(outputDir, outputFileName);

    const manifest: ManifestData = {
      topic: opts.topic,
      profile: opts.profile,
      genre: opts.genre,
      collection: COLLECTION,
      timestamp,
      retrieval: retrievalStats,
      generation: generationStats,
      lanhamAnalysis: lanhamLabels,
      drift: driftAxes,
      outputFile: outputFilePath,
    };

    const manifestPath = join(manifestDir, `${timestamp}.json`);
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    // Convenience pointer for scripting and archival
    const latestPath = join(manifestDir, 'latest-run.json');
    writeFileSync(latestPath, JSON.stringify(manifest, null, 2));

    if (generatedText.length > 0) {
      writeFileSync(outputFilePath, generatedText);
      logStage(8, 'Save artifacts', 'PASS', 'Manifest and output saved');
    } else {
      logStage(8, 'Save artifacts', 'PASS', 'Manifest saved (no output text)');
    }
    logDetail(`Manifest: ${manifestPath}`);
    if (generatedText.length > 0) logDetail(`Output:   ${outputFilePath}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logStage(8, 'Save artifacts', 'FAIL', `Error saving artifacts: ${msg}`);
  }

  console.log('\n=== TEST HARNESS COMPLETE ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
