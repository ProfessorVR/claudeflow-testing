/**
 * Real-world end-to-end validation of the Lanham system.
 * Tests the full pipeline: Tier 1 + Tier 2 + controller merge + label derivation.
 */
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import { LanhamStyleController } from '../src/god-agent/universal/lanham-style-controller.js';
import type { LanhamProseMetrics } from '../src/god-agent/universal/style-analyzer.js';
import { readFileSync } from 'fs';

// ── Real-world test passages (not from gold set) ─────────────────────────────

const PASSAGES: Array<{ name: string; text: string; expectedTraits: string }> = [
  {
    name: 'Academic philosophy (Kant-style)',
    text: `The transcendental unity of apperception is that unity through which all the manifold given in an intuition is united in a concept of the object. It is therefore entitled objective, and must be distinguished from the subjective unity of consciousness, which is a determination of inner sense — through which the manifold of intuition for such combination is empirically given. Whether I can become empirically conscious of the manifold as simultaneous or as successive depends on circumstances or empirical conditions. Therefore the empirical unity of consciousness, through association of representations, itself concerns an appearance and is wholly contingent.`,
    expectedTraits: 'noun-style or balanced, hypotactic, high register',
  },
  {
    name: 'Hemingway-style fiction',
    text: `The old man sat in the chair and looked at the sea. The sea was blue and flat. He drank his coffee and it was good. The sun came up and the boats went out. He watched them go. He did not think about the fish or the net or the money. He sat and he drank and he watched the sea. The wind came from the east and it was warm. He closed his eyes.`,
    expectedTraits: 'verb-style, paratactic, running, low register',
  },
  {
    name: 'Legal contract language',
    text: `Notwithstanding any provision of this Agreement to the contrary, in the event that the Borrower shall fail to make any payment of principal or interest on the Note when due, whether at the stated maturity, by acceleration, or otherwise, the Lender shall be entitled, without notice to the Borrower, to exercise all rights and remedies available under applicable law, including but not limited to the right to declare all outstanding obligations immediately due and payable, and to proceed with foreclosure of the collateral securing such obligations pursuant to the terms of the Security Agreement.`,
    expectedTraits: 'noun-style, hypotactic, periodic, unvoiced, high register',
  },
  {
    name: 'Conversational blog post',
    text: `So I tried the new coffee place on 5th Street and honestly? It's pretty great. The barista was super friendly and they have this amazing oat milk latte that's like, ridiculously smooth. I'm not usually a latte person but this one totally converted me. Anyway if you're in the neighborhood you should definitely check it out. They're open till like 8pm on weekdays. Just saying.`,
    expectedTraits: 'verb-style, paratactic, running, voiced, low register',
  },
  {
    name: 'Scientific methods section',
    text: `Participants were recruited from three metropolitan universities through departmental email lists and campus bulletin boards. Inclusion criteria required participants to be native English speakers between the ages of 18 and 35 with no reported history of neurological impairment. The experimental protocol was approved by the Institutional Review Board of each participating institution. Informed consent was obtained from all participants prior to data collection. Stimuli consisted of 240 sentence pairs presented in randomized order on a computer display.`,
    expectedTraits: 'noun-style, running, unvoiced, high register, transparent',
  },
  {
    name: 'Churchill-style oratory',
    text: `We have before us an ordeal of the most grievous kind. We have before us many, many long months of struggle and of suffering. You ask, what is our policy? I can say: It is to wage war, by sea, land and air, with all our might and with all the strength that God can give us; to wage war against a monstrous tyranny, never surpassed in the dark, lamentable catalogue of human crime. That is our policy. You ask, what is our aim? I can answer in one word: It is victory, victory at all costs, victory in spite of all terror, victory, however long and hard the road may be.`,
    expectedTraits: 'verb-style, paratactic, voiced, mixed/high register, opaque',
  },
];

async function main() {
  const tier1 = new LanhamProseAnalyzer('general');
  const tier2 = new AdvancedLanhamAnalyzer('general');

  console.log('='.repeat(90));
  console.log('  LANHAM SYSTEM — REAL-WORLD END-TO-END VALIDATION');
  console.log('='.repeat(90));
  console.log('');
  console.log('Pipeline: Tier 1 + Tier 2 → Controller mergeWithPolicy() → Hybrid output');
  console.log('Periodic scores from Tier 2 ensemble, all labels from Tier 1, label-aligned explanations');
  console.log('');

  for (const passage of PASSAGES) {
    console.log('-'.repeat(90));
    console.log(`TEST: ${passage.name}`);
    console.log(`Expected: ${passage.expectedTraits}`);
    console.log('');

    const [t1, t2] = await Promise.all([
      tier1.fullAnalysis(passage.text),
      tier2.fullAnalysis(passage.text),
    ]);

    const { merged, diagnosticLog } = LanhamStyleController.mergeWithPolicy(t1, t2);

    // Display merged results
    console.log('  LABELS:');
    console.log(`    Noun/Verb:     ${merged.labels.nounVerb}`);
    console.log(`    Parataxis:     ${merged.labels.parataxisHypotaxis}`);
    console.log(`    Periodic:      ${merged.labels.periodicRunning}`);
    console.log(`    Voice:         ${merged.labels.voice}`);
    console.log(`    Register:      ${merged.labels.primaryRegister}`);
    console.log(`    Opacity:       ${merged.labels.opacity}`);

    console.log('  SCORES:');
    console.log(`    nounVerbRatio:     ${merged.nounVerbRatio.toFixed(3)}  (${t1.nounVerbRatio.toFixed(3)} T1)`);
    console.log(`    parataxisRatio:    ${merged.parataxisHypotaxisRatio.toFixed(3)}  (${t1.parataxisHypotaxisRatio.toFixed(3)} T1, ${t2.parataxisHypotaxisRatio.toFixed(3)} T2)`);
    console.log(`    periodicRatio:     ${merged.periodicRunningRatio.toFixed(3)}  (${t1.periodicRunningRatio.toFixed(3)} T1, ${t2.periodicRunningRatio.toFixed(3)} T2) ← T2 via hybrid`);
    console.log(`    voiceScore:        ${merged.voiceScore.toFixed(3)}`);
    console.log(`    registerScore:     ${merged.registerMarkednessScore.toFixed(3)}`);
    console.log(`    opacityScore:      ${merged.opacityScore.toFixed(3)}`);

    console.log('  CONFIDENCE:');
    console.log(`    ${Object.entries(merged.confidenceByAxis).map(([k,v]) => `${k.slice(0,5)}=${v}`).join('  ')}`);

    // Show periodic diagnostic
    if (diagnosticLog.periodicRunning) {
      const d = diagnosticLog.periodicRunning;
      console.log(`  PERIODIC HYBRID: T1 score=${d.tier1Score.toFixed(3)} T2 score=${d.tier2Score.toFixed(3)} (using ${d.scoreSource})`);
    }

    console.log('');
  }

  // ── Profile consistency check ─────────────────────────────────────────────

  console.log('-'.repeat(90));
  console.log('PROFILE CONSISTENCY CHECK');
  console.log('');

  try {
    const profileData = JSON.parse(readFileSync('.agentdb/universal/style-profiles.json', 'utf-8'));
    const active = profileData.profiles[profileData.activeProfile];
    if (active?.characteristics?.lanhamMetrics) {
      const profileMetrics = active.characteristics.lanhamMetrics;
      const prov = active.metadata?.metricsProvenance;
      console.log(`  Active profile: ${profileData.activeProfile}`);
      console.log(`  Provenance: version=${prov?.analyzerVersion}, date=${prov?.calibrationDate}`);
      console.log(`  Periodic scoreSource: ${prov?.scoreSourceByAxis?.periodicRunning} (should be tier2)`);
      console.log(`  Profile periodic ratio: ${profileMetrics.periodicRunningRatio.toFixed(4)}`);
      console.log(`  Profile periodic label: ${profileMetrics.labels.periodicRunning}`);

      // Run a test passage through the same pipeline and check drift
      const testText = PASSAGES[0].text; // Kant-style
      const [tt1, tt2] = await Promise.all([tier1.fullAnalysis(testText), tier2.fullAnalysis(testText)]);
      const { merged: testMerged } = LanhamStyleController.mergeWithPolicy(tt1, tt2);

      const profilePR = profileMetrics.periodicRunningRatio;
      const testPR = testMerged.periodicRunningRatio;
      const delta = Math.abs(testPR - profilePR);
      console.log(`  Generated periodic ratio: ${testPR.toFixed(4)}`);
      console.log(`  Delta from profile: ${delta.toFixed(4)} (${delta > 0.1 ? 'DRIFT DETECTED' : 'within normal range'})`);
      console.log(`  Label consistency: profile="${profileMetrics.labels.periodicRunning}" generated="${testMerged.labels.periodicRunning}"`);
      console.log(`  Explanation references T1 score (label-aligned): ${testMerged.explanations.periodicRunning.includes('periodic') || testMerged.explanations.periodicRunning.includes('running') || testMerged.explanations.periodicRunning.includes('Mixed') ? 'YES - consistent' : 'CHECK'}`);
    } else {
      console.log('  No lanhamMetrics on active profile');
    }
  } catch (e: any) {
    console.log(`  Profile check error: ${e.message}`);
  }

  console.log('');
  console.log('='.repeat(90));
  console.log('  VALIDATION COMPLETE');
  console.log('='.repeat(90));
}

main().catch(e => { console.error(e); process.exit(1); });
