/**
 * Run the Lanham analyzer on the chain-aligned outfielder rewrite and compare
 * to the ACTIVE trained profile (dalton-philosophical-mo2fmhy2).
 * Strips LaTeX + markdown so the analyzer sees clean main-text prose
 * (footnotes/comments/headers/math removed).
 */
import { readFileSync, writeFileSync } from 'fs';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

const INPUT = '/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Working tex versions/Outfielder Problem (chain-aligned rewrite 2026-06-10).md';
const PROFILE_JSON = '/home/dalton/projects/claudeflow-testing/.agentdb/universal/style-profiles.json';
const PROFILE_ID = 'dalton-philosophical-mo2fmhy2';
const REPORT_OUT = '/home/dalton/projects/claudeflow-testing/tmp/outfielder-lanham-report.md';
const PROSE_OUT = '/home/dalton/projects/claudeflow-testing/tmp/outfielder-stripped-prose.txt';

/** Find index of brace matching the open brace at openIdx. */
function matchBrace(s: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** Remove or unwrap `\cmd{...}` with proper brace matching; loops until stable. */
function processCmd(text: string, name: string, mode: 'drop' | 'unwrap'): string {
  const needle = '\\' + name + '{';
  let out = text;
  for (;;) {
    const start = out.indexOf(needle);
    if (start === -1) break;
    const open = start + needle.length - 1;
    const close = matchBrace(out, open);
    if (close === -1) break; // malformed; bail
    const inner = out.slice(open + 1, close);
    const replacement = mode === 'unwrap' ? inner : '';
    out = out.slice(0, start) + replacement + out.slice(close + 1);
  }
  return out;
}

/** Strip inline math $...$ into readable ascii tokens (A_4 -> A4, \rightarrow -> to). */
function stripInlineMath(text: string): string {
  return text.replace(/\$([^$]*)\$/g, (_m, body: string) => {
    let b = body;
    b = b.replace(/\\rightarrow|\\to|\\Rightarrow/g, ' to ');
    b = b.replace(/\\[a-zA-Z]+/g, '');   // drop remaining math commands
    b = b.replace(/[{}]/g, '');
    b = b.replace(/_/g, '');              // A_4 -> A4
    b = b.replace(/\s+/g, ' ').trim();
    return b;
  });
}

function stripLatexMarkdown(src: string): string {
  let s = src;
  // 1. full-line and trailing comments (ignore escaped \%)
  s = s.replace(/(^|[^\\])%.*$/gm, '$1');
  // 2. comment environments
  s = s.replace(/\\begin\{comment\}[\s\S]*?\\end\{comment\}/g, '');
  // 3. inlinenote{...} = author scratch notes, not prose -> drop
  s = processCmd(s, 'inlinenote', 'drop');
  // 4. footnotes -> drop (analyze main text only)
  s = processCmd(s, 'footnote', 'drop');
  // 5. headings -> drop entirely
  for (const h of ['subsubsection', 'subsection', 'section', 'chapter', 'paragraph']) {
    s = processCmd(s, h, 'drop');
    s = processCmd(s, h + '*', 'drop');
  }
  // 6. block-quote env: keep inner text, drop the wrappers
  s = s.replace(/\\begin\{adjustwidth\}\{[^}]*\}\{[^}]*\}/g, '');
  s = s.replace(/\\end\{adjustwidth\}/g, '');
  s = s.replace(/\\begin\{[a-zA-Z*]+\}(\{[^}]*\})*/g, '');
  s = s.replace(/\\end\{[a-zA-Z*]+\}/g, '');
  // 7. inline math
  s = stripInlineMath(s);
  // 8. unwrap formatting commands (keep inner text)
  for (const c of ['textit', 'textbf', 'emph', 'textsc', 'texttt', 'underline', 'gk', 'textsuperscript', 'textsubscript']) {
    s = processCmd(s, c, 'unwrap');
  }
  // 9. LaTeX quotes -> straight
  s = s.replace(/``/g, '"').replace(/''/g, '"').replace(/`/g, "'");
  // 10. remaining bare commands and line-breaks
  s = s.replace(/\\\\/g, ' ');
  s = s.replace(/\\[a-zA-Z]+\s?/g, ' ');
  s = s.replace(/\\[,; ]/g, ' ');
  // 11. markdown bold/italic (belt-and-suspenders)
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/^#+\s+.+$/gm, '');
  // 12. tidy
  s = s.replace(/[{}]/g, '');
  s = s.replace(/[ \t]+/g, ' ');
  s = s.replace(/ ([.,;:)])/g, '$1');     // space before punctuation
  s = s.replace(/\(\s*[,;]\s*/g, '(');     // "( , " artifacts from removed math
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

async function main() {
  const raw = readFileSync(INPUT, 'utf-8');
  const prose = stripLatexMarkdown(raw);
  writeFileSync(PROSE_OUT, prose);
  const wc = prose.split(/\s+/).filter(Boolean).length;

  const analyzer = new LanhamProseAnalyzer();
  const metrics = await analyzer.fullAnalysis(prose);

  const profiles = JSON.parse(readFileSync(PROFILE_JSON, 'utf-8'));
  const store = profiles.profiles || profiles;
  const trainedProfile = store[PROFILE_ID];
  const trainedLanham = trainedProfile.characteristics.lanhamMetrics;
  const trainedSent = trainedProfile.characteristics.sentences;

  const sentences = prose.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const words = prose.split(/\s+/).filter(Boolean);
  const avgSentLen = words.length / Math.max(sentences.length, 1);
  const wlen = (s: string) => s.split(/\s+/).filter(Boolean).length;
  const shortSentRatio = sentences.filter(s => wlen(s) < 15).length / sentences.length;
  const medSentRatio = sentences.filter(s => wlen(s) >= 15 && wlen(s) <= 30).length / sentences.length;
  const longSentRatio = sentences.filter(s => wlen(s) > 30).length / sentences.length;

  const report: string[] = [];
  const push = (s = '') => report.push(s);
  const fmt = (n: number | undefined, d = 3) => (n === undefined || n === null ? 'n/a' : n.toFixed(d));
  const delta = (a: number | undefined, t: number | undefined) => {
    if (a === undefined || t === undefined) return 'n/a';
    const dd = a - t; const pct = t !== 0 ? (dd / t) * 100 : dd * 100; const sg = dd >= 0 ? '+' : '';
    return `${sg}${dd.toFixed(3)} (${sg}${pct.toFixed(1)}%)`;
  };

  push('# Lanham Style Conformance Report — Outfielder Rewrite');
  push('');
  push('**Document:** The Outfielder (chain-aligned rewrite, 2026-06-10)');
  push('**Analyzer:** LanhamProseAnalyzer (calibrated heuristic)');
  push(`**Trained profile:** \`${PROFILE_ID}\` (active philosophical profile)`);
  push(`**Analyzed prose (main text, footnotes/headers/math stripped):** ${wc.toLocaleString()} words, ${sentences.length} sentences`);
  push('');

  push('## Sentence-Level Metrics');
  push('');
  push('| Metric | Draft | Trained target | Δ |');
  push('|---|---|---|---|');
  push(`| Avg sentence length (words) | ${avgSentLen.toFixed(2)} | ${trainedSent.averageLength.toFixed(2)} | ${delta(avgSentLen, trainedSent.averageLength)} |`);
  push(`| Short ratio (<15w) | ${shortSentRatio.toFixed(3)} | ${trainedSent.shortSentenceRatio.toFixed(3)} | ${delta(shortSentRatio, trainedSent.shortSentenceRatio)} |`);
  push(`| Medium ratio (15–30w) | ${medSentRatio.toFixed(3)} | ${trainedSent.mediumSentenceRatio.toFixed(3)} | ${delta(medSentRatio, trainedSent.mediumSentenceRatio)} |`);
  push(`| Long ratio (>30w) | ${longSentRatio.toFixed(3)} | ${trainedSent.longSentenceRatio.toFixed(3)} | ${delta(longSentRatio, trainedSent.longSentenceRatio)} |`);
  push('');

  push('## Lanham Axis Metrics');
  push('');
  push('| Axis / Metric | Draft | Trained target | Δ |');
  push('|---|---|---|---|');
  const rows: [string, number | undefined, number | undefined][] = [
    ['Noun/verb ratio', metrics.nounVerbRatio, trainedLanham.nounVerbRatio],
    ['Nominalization density (/100w)', metrics.nominalizationDensity, trainedLanham.nominalizationDensity],
    ['Prepositional-phrase density', metrics.prepositionalPhraseDensity, trainedLanham.prepositionalPhraseDensity],
    ['Be-verb ratio', metrics.beVerbRatio, trainedLanham.beVerbRatio],
    ['Parataxis/hypotaxis ratio', metrics.parataxisHypotaxisRatio, trainedLanham.parataxisHypotaxisRatio],
    ['Coordinating-conj density', metrics.coordinatingConjunctionDensity, trainedLanham.coordinatingConjunctionDensity],
    ['Subordinating-conj density', metrics.subordinatingConjunctionDensity, trainedLanham.subordinatingConjunctionDensity],
    ['Periodic/running ratio', metrics.periodicRunningRatio, trainedLanham.periodicRunningRatio],
    ['Pre-main-verb clause count', metrics.preMainVerbClauseCount, trainedLanham.preMainVerbClauseCount],
    ['Voice score', metrics.voiceScore, trainedLanham.voiceScore],
    ['Dynamic range', metrics.dynamicRange, trainedLanham.dynamicRange],
    ['Latinate/Germanic ratio', metrics.latinateGermanicRatio, trainedLanham.latinateGermanicRatio],
    ['Register markedness', metrics.registerMarkednessScore, trainedLanham.registerMarkednessScore],
    ['Opacity score', metrics.opacityScore, trainedLanham.opacityScore],
    ['Self-consciousness score', metrics.selfConsciousnessScore, trainedLanham.selfConsciousnessScore],
  ];
  for (const [n, a, t] of rows) push(`| ${n} | ${fmt(a)} | ${fmt(t)} | ${delta(a, t)} |`);
  push('');

  push('## Qualitative Labels');
  push('');
  const dl = metrics.labels || {}; const tl = trainedLanham.labels || {};
  push('| Axis | Draft label | Trained label | Match |');
  push('|---|---|---|---|');
  let labelMatches = 0; let labelTotal = 0;
  for (const k of ['nounVerb', 'parataxisHypotaxis', 'periodicRunning', 'voice', 'primaryRegister', 'opacity']) {
    const d = (dl as any)[k]; const t = (tl as any)[k];
    const m = d === t; labelTotal++; if (m) labelMatches++;
    push(`| ${k} | ${d ?? 'n/a'} | ${t ?? 'n/a'} | ${m ? '✓' : '✗'} |`);
  }
  push('');

  push('## Analyzer Explanations (draft)');
  push('');
  for (const [k, v] of Object.entries(metrics.explanations || {})) { push(`**${k}**: ${v}`); push(''); }

  // Conformance score on six primary axes
  const axes: [number | undefined, number | undefined][] = [
    [metrics.nounVerbRatio, trainedLanham.nounVerbRatio],
    [metrics.parataxisHypotaxisRatio, trainedLanham.parataxisHypotaxisRatio],
    [metrics.periodicRunningRatio, trainedLanham.periodicRunningRatio],
    [metrics.voiceScore, trainedLanham.voiceScore],
    [metrics.registerMarkednessScore, trainedLanham.registerMarkednessScore],
    [metrics.opacityScore, trainedLanham.opacityScore],
  ];
  const devs = axes.filter(([a, t]) => a != null && t != null).map(([a, t]) => Math.abs((a as number) - (t as number)));
  const mad = devs.reduce((s, d) => s + d, 0) / devs.length;
  const conf = Math.max(0, 1 - mad);
  push('## Overall Conformance');
  push('');
  push(`**Label matches:** ${labelMatches}/${labelTotal}`);
  push(`**Mean absolute deviation (6 primary axes):** ${mad.toFixed(3)}`);
  push(`**Conformance score (1 − MAD):** ${conf.toFixed(3)}`);
  push('');
  push('Bands: ≥0.90 imperceptible variance · 0.80–0.89 readers perceive continuity · 0.70–0.79 same register, audible divergence · <0.70 noticeable voice shift.');
  push('');
  push('## Raw JSON');
  push('```json');
  push(JSON.stringify(metrics, null, 2));
  push('```');

  writeFileSync(REPORT_OUT, report.join('\n'));

  // console summary
  console.log('--- OUTFIELDER LANHAM CONFORMANCE ---');
  console.log(`prose words: ${wc}, sentences: ${sentences.length}, avgLen: ${avgSentLen.toFixed(1)}`);
  console.log(`short/med/long: ${shortSentRatio.toFixed(2)}/${medSentRatio.toFixed(2)}/${longSentRatio.toFixed(2)}  (target ${trainedSent.shortSentenceRatio.toFixed(2)}/${trainedSent.mediumSentenceRatio.toFixed(2)}/${trainedSent.longSentenceRatio.toFixed(2)})`);
  for (const [n, a, t] of rows) console.log(`${n}: ${fmt(a)} (target ${fmt(t)}, Δ ${delta(a, t)})`);
  console.log('labels:');
  for (const k of ['nounVerb', 'parataxisHypotaxis', 'periodicRunning', 'voice', 'primaryRegister', 'opacity'])
    console.log(`  ${k}: draft=${(dl as any)[k]} | trained=${(tl as any)[k]} | ${(dl as any)[k] === (tl as any)[k] ? 'MATCH' : 'DIFF'}`);
  console.log(`label matches: ${labelMatches}/${labelTotal}`);
  console.log(`MAD(6 axes): ${mad.toFixed(3)}  CONFORMANCE: ${conf.toFixed(3)}`);
  console.log(`report -> ${REPORT_OUT}`);
  console.log(`stripped prose -> ${PROSE_OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
