/**
 * Run Lanham analyzer on the phantasma console draft and compare to trained profile.
 */
import { readFileSync, writeFileSync } from 'fs';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

const INPUT_MD = '/home/dalton/projects/claudeflow-testing/tmp/a2-aisthesis-console-draft-2026-04-23.md';
const PROFILE_JSON = '/home/dalton/projects/claudeflow-testing/.agentdb/universal/style-profiles.json';
const REPORT_OUT = '/home/dalton/projects/claudeflow-testing/tmp/a2-aisthesis-lanham-report.md';

/** Strip markdown formatting to get raw prose for analysis. */
function stripMarkdown(md: string): string {
  return md
    .replace(/^#+\s+.+$/gm, '')              // strip heading lines
    .replace(/\[\^(\w+)\]:\s*[\s\S]*?(?=\n\[\^|\n##|\Z)/g, '') // strip footnote defs
    .replace(/\[\^(\w+)\]/g, '')             // strip footnote markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')       // strip bold
    .replace(/\*([^*]+)\*/g, '$1')           // strip italics
    .replace(/^---\s*$/gm, '')               // strip hr
    .replace(/\n{3,}/g, '\n\n')              // collapse blank runs
    .trim();
}

async function main() {
  const md = readFileSync(INPUT_MD, 'utf-8');
  const prose = stripMarkdown(md);
  const wc = prose.split(/\s+/).filter(Boolean).length;

  const analyzer = new LanhamProseAnalyzer();
  const metrics = await analyzer.fullAnalysis(prose);

  const profiles = JSON.parse(readFileSync(PROFILE_JSON, 'utf-8'));
  const trainedProfile = profiles.profiles['dalton-academic-mkn82c3v'];
  const trainedLanham = trainedProfile.characteristics.lanhamMetrics;
  const trainedSent = trainedProfile.characteristics.sentences;
  const trainedVocab = trainedProfile.characteristics.vocabulary;
  const trainedTone = trainedProfile.characteristics.tone;
  const trainedStruct = trainedProfile.characteristics.structure;

  // Compute basic sentence/vocab metrics on the draft for side-by-side comparison
  const sentences = prose.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const words = prose.split(/\s+/).filter(Boolean);
  const avgSentLen = words.length / Math.max(sentences.length, 1);
  const shortSentRatio = sentences.filter(s => s.split(/\s+/).filter(Boolean).length < 15).length / sentences.length;
  const longSentRatio = sentences.filter(s => s.split(/\s+/).filter(Boolean).length > 30).length / sentences.length;

  const report: string[] = [];
  const push = (s: string) => report.push(s);
  const fmt = (n: number | undefined, decimals = 3) =>
    n === undefined || n === null ? 'n/a' : n.toFixed(decimals);
  const delta = (actual: number | undefined, target: number | undefined) => {
    if (actual === undefined || target === undefined) return 'n/a';
    const d = actual - target;
    const pct = target !== 0 ? (d / target) * 100 : d * 100;
    const sign = d >= 0 ? '+' : '';
    return `${sign}${d.toFixed(3)} (${sign}${pct.toFixed(1)}%)`;
  };

  push('# Lanham Style Conformance Report');
  push('');
  push('**Document:** A₁→A₂: The Actualization of Perception (console draft)');
  push('**Source:** `' + INPUT_MD.split('/').slice(-1)[0] + '`');
  push('**Analyzer:** LanhamProseAnalyzer (Tier 1 heuristic, calibrated weights)');
  push('**Trained profile:** `dalton-academic-mkn82c3v`');
  push(`**Draft word count (prose, strip-markdown):** ${wc.toLocaleString()}`);
  push(`**Draft sentence count:** ${sentences.length}`);
  push('');

  push('## Sentence-Level Metrics');
  push('');
  push('| Metric | Draft | Trained target | Δ |');
  push('|---|---|---|---|');
  push(`| Average sentence length (words) | ${avgSentLen.toFixed(2)} | ${trainedSent.averageLength.toFixed(2)} | ${delta(avgSentLen, trainedSent.averageLength)} |`);
  push(`| Short-sentence ratio (<15 words) | ${shortSentRatio.toFixed(3)} | ${trainedSent.shortSentenceRatio.toFixed(3)} | ${delta(shortSentRatio, trainedSent.shortSentenceRatio)} |`);
  push(`| Long-sentence ratio (>30 words) | ${longSentRatio.toFixed(3)} | ${trainedSent.longSentenceRatio.toFixed(3)} | ${delta(longSentRatio, trainedSent.longSentenceRatio)} |`);
  push('');

  push('## Lanham Axis Metrics (six-axis analyzer)');
  push('');
  push('| Axis / Metric | Draft | Trained target | Δ |');
  push('|---|---|---|---|');

  const rows: [string, any, any][] = [
    ['Noun/verb ratio (lower = more verb-dominant)', metrics.nounVerbRatio, trainedLanham.nounVerbRatio],
    ['Nominalization density (per 100 words)', metrics.nominalizationDensity, trainedLanham.nominalizationDensity],
    ['Prepositional-phrase density', metrics.prepositionalPhraseDensity, trainedLanham.prepositionalPhraseDensity],
    ['Be-verb ratio', metrics.beVerbRatio, trainedLanham.beVerbRatio],
    ['Parataxis/hypotaxis ratio', metrics.parataxisHypotaxisRatio, trainedLanham.parataxisHypotaxisRatio],
    ['Coordinating conjunction density', metrics.coordinatingConjunctionDensity, trainedLanham.coordinatingConjunctionDensity],
    ['Subordinating conjunction density', metrics.subordinatingConjunctionDensity, trainedLanham.subordinatingConjunctionDensity],
    ['Periodic/running ratio (higher = more periodic)', metrics.periodicRunningRatio, trainedLanham.periodicRunningRatio],
    ['Pre-main-verb clause count (per sentence avg)', metrics.preMainVerbClauseCount, trainedLanham.preMainVerbClauseCount],
    ['Voice score', metrics.voiceScore, trainedLanham.voiceScore],
    ['Dynamic range', metrics.dynamicRange, trainedLanham.dynamicRange],
    ['Latinate/Germanic ratio', metrics.latinateGermanicRatio, trainedLanham.latinateGermanicRatio],
    ['Register markedness score', metrics.registerMarkednessScore, trainedLanham.registerMarkednessScore],
    ['Opacity score', metrics.opacityScore, trainedLanham.opacityScore],
    ['Self-consciousness score', metrics.selfConsciousnessScore, trainedLanham.selfConsciousnessScore],
  ];
  for (const [name, actual, target] of rows) {
    push(`| ${name} | ${fmt(actual)} | ${fmt(target)} | ${delta(actual, target)} |`);
  }
  push('');

  push('## Tacit (Rhetorical) Patterns');
  push('');
  push('| Pattern | Draft | Trained target |');
  push('|---|---|---|');
  const tacit = metrics.tacitPatterns || {};
  const trainedTacit = trainedLanham.tacitPatterns || {};
  for (const k of ['alliterationDensity','polyptotonDensity','chiasmusCount','antithesisCount','anaphoraCount','isocolonCount','climaxPatternCount']) {
    push(`| ${k} | ${fmt((tacit as any)[k])} | ${fmt((trainedTacit as any)[k])} |`);
  }
  push('');

  push('## Qualitative Labels');
  push('');
  const draftLabels = metrics.labels || {};
  const trainedLabels = trainedLanham.labels || {};
  push('| Axis | Draft label | Trained label | Match |');
  push('|---|---|---|---|');
  for (const k of ['nounVerb','parataxisHypotaxis','periodicRunning','voice','primaryRegister','opacity']) {
    const d = (draftLabels as any)[k];
    const t = (trainedLabels as any)[k];
    const match = d === t ? '✓' : '✗';
    push(`| ${k} | ${d ?? 'n/a'} | ${t ?? 'n/a'} | ${match} |`);
  }
  push('');

  push('## Analyzer Explanations (for the draft)');
  push('');
  const expl = metrics.explanations || {};
  for (const [k, v] of Object.entries(expl)) {
    push(`**${k}**: ${v}`);
    push('');
  }

  push('## Overall Conformance Summary');
  push('');
  // Compute a rough conformance score: mean absolute relative deviation on the 6 primary axis scores
  const axes: [number | undefined, number | undefined][] = [
    [metrics.nounVerbRatio, trainedLanham.nounVerbRatio],
    [metrics.parataxisHypotaxisRatio, trainedLanham.parataxisHypotaxisRatio],
    [metrics.periodicRunningRatio, trainedLanham.periodicRunningRatio],
    [metrics.voiceScore, trainedLanham.voiceScore],
    [metrics.registerMarkednessScore, trainedLanham.registerMarkednessScore],
    [metrics.opacityScore, trainedLanham.opacityScore],
  ];
  const deviations = axes
    .filter(([a, t]) => a !== undefined && t !== undefined)
    .map(([a, t]) => Math.abs((a as number) - (t as number)));
  const meanAbsDev = deviations.reduce((s, d) => s + d, 0) / deviations.length;
  const conformanceScore = Math.max(0, 1 - meanAbsDev);
  push(`**Mean absolute deviation (6 primary axes):** ${meanAbsDev.toFixed(3)}`);
  push(`**Conformance score (1 − mean abs dev):** ${conformanceScore.toFixed(3)}`);
  push('');
  push('Interpretation:');
  push('- 1.00 = identical to trained profile on the six primary Lanham axes');
  push('- 0.90-0.99 = very close match; imperceptible stylistic variance');
  push('- 0.80-0.89 = close match; readers would perceive stylistic continuity');
  push('- 0.70-0.79 = moderate match; recognizable as the same register but with audible divergence');
  push('- <0.70 = distinct enough that a careful reader might notice a shift in voice');
  push('');

  push('## Raw JSON');
  push('');
  push('```json');
  push(JSON.stringify(metrics, null, 2));
  push('```');

  writeFileSync(REPORT_OUT, report.join('\n'));
  console.log(`Report written: ${REPORT_OUT}`);
  console.log(`Word count analyzed: ${wc}`);
  console.log(`Mean absolute deviation: ${meanAbsDev.toFixed(3)}`);
  console.log(`Conformance score: ${conformanceScore.toFixed(3)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
