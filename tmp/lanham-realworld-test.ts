#!/usr/bin/env npx tsx
/**
 * Real-world Lanham pipeline integration test.
 * Generates a short philosophical section with the active style profile,
 * then runs Lanham analysis on the output to verify style integration.
 */

// Load .env explicitly
import { readFileSync } from 'fs';
for (const line of readFileSync('.env', 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

import { UniversalAgent } from '../src/god-agent/universal/index.js';

const TOPIC = `Write a 400-500 word scholarly section analyzing the relationship between Aristotle's concept of phantasia (imagination) in De Anima and the phenomenological experience of virtual reality. Specifically, examine how Aristotle's claim that phantasia provides mental images "when we do not perceive distinctly" parallels the way virtual environments supply perceptual content in the absence of corresponding physical objects. Engage directly with Aristotle's text and connect to Heidegger's notion of being-in-the-world.`;

async function main() {
  console.log('=== Lanham Real-World Integration Test ===\n');

  const agent = new UniversalAgent({ verbose: false });
  await agent.initialize();

  // Verify active profile
  const profiles = agent.listStyleProfiles();
  console.log('Available profiles:', profiles.length);
  const activeProfile = (agent as any).deps?.styleProfileManager?.getActiveProfile?.();
  if (activeProfile) {
    console.log('Active profile:', activeProfile.metadata.name, `(${activeProfile.metadata.id})`);
    console.log('Has lanhamMetrics:', !!activeProfile.characteristics.lanhamMetrics);
    console.log('Has rhetoricalMoves:', !!activeProfile.characteristics.rhetoricalMoves);
    console.log('Has citationIntegration:', !!activeProfile.characteristics.citationIntegration);
  } else {
    console.log('WARNING: No active profile found');
  }

  console.log('\n--- Generating with Lanham pipeline ---');
  console.log('Topic:', TOPIC.substring(0, 100) + '...\n');

  const startTime = Date.now();

  try {
    const result = await agent.write(TOPIC, {
      whitelistMode: true,
      length: 'short',
      wordTarget: '400-500',
      lanhamStyleTarget: {
        atThroughMode: 'transparent with AT moments',
        genre: 'academic',
        voiceTarget: 'voiced',
        registerTarget: 'high',
        tacitPersuasionLevel: 'moderate',
      },
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Generation completed in ${elapsed}s`);
    console.log(`Word count: ${result.content.split(/\s+/).length}`);
    console.log(`Content length: ${result.content.length} chars\n`);

    // Now run Lanham analysis on the generated output
    console.log('--- Post-generation Lanham analysis ---\n');

    const { LanhamProseAnalyzer } = await import('../src/god-agent/cli/style/lanham-prose-analyzer.js');
    const analyzer = new LanhamProseAnalyzer('academic');
    const metrics = await analyzer.fullAnalysis(result.content);

    console.log('Lanham Axis Results:');
    console.log(`  Noun/Verb:      ${metrics.labels.nounVerb} (ratio: ${metrics.nounVerbRatio.toFixed(3)})`);
    console.log(`  Architecture:   ${metrics.labels.periodicRunning} (ratio: ${metrics.periodicRunningRatio.toFixed(3)})`);
    console.log(`  Connection:     ${metrics.labels.parataxisHypotaxis} (ratio: ${metrics.parataxisHypotaxisRatio.toFixed(3)})`);
    console.log(`  Voice:          ${metrics.labels.voice} (score: ${metrics.voiceScore.toFixed(3)})`);
    console.log(`  Register:       ${metrics.labels.primaryRegister} (lgr: ${metrics.latinateGermanicRatio.toFixed(3)}, markedness: ${metrics.registerMarkednessScore.toFixed(3)})`);
    console.log(`  Opacity:        ${metrics.labels.opacity} (score: ${metrics.opacityScore.toFixed(3)})`);
    console.log(`  Tacit patterns: alliteration=${metrics.tacitPatterns.alliterationDensity.toFixed(2)}, anaphora=${metrics.tacitPatterns.anaphoraCount}, isocolon=${metrics.tacitPatterns.isocolonCount}`);

    // Compare against profile baseline
    if (activeProfile?.characteristics?.lanhamMetrics) {
      const baseline = activeProfile.characteristics.lanhamMetrics;
      console.log('\n--- Drift Analysis (generated vs. profile baseline) ---\n');

      const axes = [
        { name: 'nounVerb', gen: metrics.labels.nounVerb, target: baseline.labels.nounVerb, tier: 'HARD' },
        { name: 'register', gen: metrics.labels.primaryRegister, target: baseline.labels.primaryRegister, tier: 'HARD' },
        { name: 'voice', gen: metrics.labels.voice, target: baseline.labels.voice, tier: 'FIRM' },
        { name: 'parataxis', gen: metrics.labels.parataxisHypotaxis, target: baseline.labels.parataxisHypotaxis, tier: 'SOFT' },
        { name: 'periodic', gen: metrics.labels.periodicRunning, target: baseline.labels.periodicRunning, tier: 'INFO' },
        { name: 'opacity', gen: metrics.labels.opacity, target: baseline.labels.opacity, tier: 'SOFT' },
      ];

      for (const axis of axes) {
        const match = axis.gen === axis.target ? 'MATCH' : 'DRIFT';
        const icon = match === 'MATCH' ? 'OK' : (axis.tier === 'HARD' ? 'REGEN' : 'WARN');
        console.log(`  [${axis.tier}] ${axis.name}: generated="${axis.gen}" target="${axis.target}" → ${icon}`);
      }
    }

    // Print the actual generated text
    console.log('\n--- Generated Text ---\n');
    console.log(result.content.substring(0, 2000));
    if (result.content.length > 2000) console.log('\n[... truncated ...]');

  } catch (error) {
    console.error('Generation FAILED:', error);
  }

  await agent.shutdown();
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
