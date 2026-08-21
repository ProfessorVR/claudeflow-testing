import * as fs from 'fs';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

const SCRATCH = '/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/6304d5a4-a19f-4469-bf69-d5a2e0a40627/scratchpad/budweiser';
const files: Record<string, string> = {
  'CaseStudy1': `${SCRATCH}/cs1.txt`,
  'CaseStudy2': `${SCRATCH}/cs2.txt`,
  'Budweiser(current)': `${SCRATCH}/bud.txt`,
};

const a = new LanhamProseAnalyzer();

function fmt(n: number): string { return (Math.round(n * 1000) / 1000).toString(); }

(async () => {
  const results: Record<string, any> = {};
  for (const [name, path] of Object.entries(files)) {
    const text = fs.readFileSync(path, 'utf8');
    results[name] = await a.fullAnalysis(text);
  }

  const rows: (keyof any)[] = [
    'nounVerbRatio','nominalizationDensity','prepositionalPhraseDensity','beVerbRatio',
    'parataxisHypotaxisRatio','coordinatingConjunctionDensity','subordinatingConjunctionDensity',
    'periodicRunningRatio','preMainVerbClauseCount','voiceScore','dynamicRange',
    'latinateGermanicRatio','registerMarkednessScore','opacityScore','selfConsciousnessScore',
  ];
  const names = Object.keys(files);
  console.log('\n================= LANHAM NUMERIC METRICS =================');
  console.log('metric'.padEnd(30) + names.map(n => n.padStart(20)).join(''));
  for (const r of rows) {
    console.log(String(r).padEnd(30) + names.map(n => fmt((results[n] as any)[r]).padStart(20)).join(''));
  }

  console.log('\n================= LABELS =================');
  const labelKeys = ['nounVerb','parataxisHypotaxis','periodicRunning','voice','primaryRegister','opacity'];
  console.log('axis'.padEnd(22) + names.map(n => n.padStart(28)).join(''));
  for (const lk of labelKeys) {
    console.log(lk.padEnd(22) + names.map(n => String((results[n] as any).labels[lk]).padStart(28)).join(''));
  }

  console.log('\n================= TACIT FIGURES (density/count) =================');
  const tk = ['alliterationDensity','polyptotonDensity','chiasmusCount','antithesisCount','anaphoraCount','isocolonCount','climaxPatternCount'];
  console.log('figure'.padEnd(22) + names.map(n => n.padStart(20)).join(''));
  for (const t of tk) {
    console.log(t.padEnd(22) + names.map(n => fmt((results[n] as any).tacitPatterns[t]).padStart(20)).join(''));
  }

  console.log('\n================= EXPLANATIONS (target = avg of CS1+CS2) =================');
  for (const name of ['CaseStudy1','CaseStudy2']) {
    console.log(`\n--- ${name} ---`);
    const ex = (results[name] as any).explanations;
    for (const k of Object.keys(ex)) console.log(`  [${k}] ${ex[k]}`);
  }

  fs.writeFileSync(`${SCRATCH}/lanham-results.json`, JSON.stringify(results, null, 2));
  console.log('\nSaved full JSON -> lanham-results.json');
})();
