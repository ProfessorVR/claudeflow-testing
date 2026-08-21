/**
 * Lanham style analyzer + trained-profile comparator — the FCDP "G-A" style gate.
 *
 *   npx tsx scripts/analyze-lanham.ts <file> [profileKey]
 *
 * Strips LaTeX/Markdown to plain prose, runs the LanhamProseAnalyzer, and prints
 * the prose's Lanham metrics. If a [profileKey] is given, it also reads that trained
 * profile's stored lanhamMetrics from .agentdb/universal/style-profiles.json and
 * shows the per-metric delta (Δ) between your draft and your trained voice.
 *
 * List your profile keys with:  node scripts/style-status.mjs
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILE_JSON = resolve(__dirname, '..', '.agentdb', 'universal', 'style-profiles.json');

/** Remove `\cmd{ ...balanced... }` (and optional trailing `{...}`) occurrences. */
function removeCmdWithArg(text: string, cmds: string[], unwrap = false, twoArgs = false): string {
  for (const cmd of cmds) {
    let out = '';
    let i = 0;
    const needle = `\\${cmd}{`;
    while (i < text.length) {
      const idx = text.indexOf(needle, i);
      if (idx === -1) { out += text.slice(i); break; }
      out += text.slice(i, idx);
      let depth = 0, j = idx + needle.length - 1, arg1 = '';
      for (; j < text.length; j++) {
        const c = text[j];
        if (c === '{') { depth++; if (depth === 1) continue; }
        else if (c === '}') { depth--; if (depth === 0) { j++; break; } }
        if (depth >= 1) arg1 += c;
      }
      let arg2 = '';
      if (twoArgs && text[j] === '{') {
        let d2 = 0;
        for (; j < text.length; j++) {
          const c = text[j];
          if (c === '{') { d2++; if (d2 === 1) continue; }
          else if (c === '}') { d2--; if (d2 === 0) { j++; break; } }
          if (d2 >= 1) arg2 += c;
        }
      }
      if (unwrap) out += twoArgs ? arg2 : arg1;
      i = j;
    }
    text = out;
  }
  return text;
}

function stripLatex(src: string): string {
  let t = src;
  const beg = t.indexOf('\\begin{document}');
  if (beg !== -1) t = t.slice(beg + '\\begin{document}'.length);
  const end = t.indexOf('\\end{document}');
  if (end !== -1) t = t.slice(0, end);
  t = t.replace(/\\begin\{comment\}[\s\S]*?\\end\{comment\}/g, ' ');
  t = t.replace(/\\begin\{adjustwidth\}\{[^}]*\}\{[^}]*\}[\s\S]*?\\end\{adjustwidth\}/g, ' ');
  t = t.replace(/\\begin\{quote\}[\s\S]*?\\end\{quote\}/g, ' ');
  t = t.replace(/\\begin\{(figure|comment|verbatim|Verbatim|center)\}[\s\S]*?\\end\{\1\}/g, ' ');
  t = removeCmdWithArg(t, ['footnote', 'inlinenote', 'inb', 'too'], false);
  t = removeCmdWithArg(t, ['cite', 'ref', 'autoref', 'label', 'includegraphics', 'caption'], false);
  t = removeCmdWithArg(t, ['href'], true, true);
  for (let k = 0; k < 6; k++) {
    t = removeCmdWithArg(t, ['textit', 'emph', 'textbf', 'gk', 'textsc', 'underline', 'mbox', 'text'], true);
  }
  t = removeCmdWithArg(t, ['section', 'subsection', 'subsubsection', 'paragraph', 'chapter'], false);
  t = t.replace(/\\(section|subsection|subsubsection)\*\{[^}]*\}/g, ' ');
  t = t.replace(/\$[^$]*\$/g, ' ').replace(/\\\([\s\S]*?\\\)/g, ' ');
  t = t.replace(/\\(begin|end)\{[^}]*\}/g, ' ');
  t = removeCmdWithArg(t, ['newcommand', 'renewcommand', 'setmainfont', 'newfontfamily'], false);
  t = t.replace(/\\[a-zA-Z@]+\*?(\[[^\]]*\])?/g, ' ');
  t = t.replace(/``/g, '"').replace(/''/g, '"').replace(/---/g, '—').replace(/--/g, '–')
       .replace(/\\ldots|\\dots/g, '…').replace(/[{}]/g, ' ').replace(/~/g, ' ').replace(/\\&/g, '&');
  t = t.replace(/^#+\s+.*$/gm, ' ').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
       .replace(/^\s*[-*]\s+/gm, ' ').replace(/^---\s*$/gm, ' ');
  t = t.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return t;
}

const M = [
  'nounVerbRatio','nominalizationDensity','prepositionalPhraseDensity','beVerbRatio',
  'parataxisHypotaxisRatio','coordinatingConjunctionDensity','subordinatingConjunctionDensity',
  'periodicRunningRatio','preMainVerbClauseCount','voiceScore','dynamicRange',
  'latinateGermanicRatio','registerMarkednessScore','opacityScore','selfConsciousnessScore',
] as const;

async function main() {
  const file = process.argv[2];
  const profileKey = process.argv[3];
  if (!file) { console.error('usage: npx tsx scripts/analyze-lanham.ts <file> [profileKey]'); process.exit(1); }
  const prose = stripLatex(readFileSync(file, 'utf-8'));
  const words = prose.split(/\s+/).filter(Boolean);
  const sentences = prose.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const avgLen = words.length / Math.max(sentences.length, 1);
  const shortR = sentences.filter(s => s.split(/\s+/).filter(Boolean).length < 15).length / sentences.length;
  const longR = sentences.filter(s => s.split(/\s+/).filter(Boolean).length > 30).length / sentences.length;

  const metrics: any = await new LanhamProseAnalyzer().fullAnalysis(prose);

  let target: any = null;
  if (profileKey) {
    try {
      const profs = JSON.parse(readFileSync(PROFILE_JSON, 'utf-8'));
      target = profs.profiles?.[profileKey]?.characteristics?.lanhamMetrics ?? null;
      if (!target) console.error(`(no lanhamMetrics found for profile "${profileKey}" — is the key correct and trained on >=500-word samples?)`);
    } catch { console.error(`(could not read ${PROFILE_JSON})`); }
  }

  const f = (n: any) => (n === undefined || n === null ? 'n/a' : Number(n).toFixed(3));
  console.log(`\nFILE: ${file}`);
  console.log(`prose words: ${words.length}  sentences: ${sentences.length}`);
  console.log(`avg sentence length: ${avgLen.toFixed(2)}  short(<15): ${shortR.toFixed(3)}  long(>30): ${longR.toFixed(3)}`);
  console.log('\nmetric'.padEnd(34) + 'value'.padStart(10) + (target ? 'target'.padStart(10) + 'Δ'.padStart(10) : ''));
  for (const k of M) {
    const v = metrics[k];
    let line = k.padEnd(34) + f(v).padStart(10);
    if (target) { const t = target[k]; line += f(t).padStart(10) + (t != null ? (v - t >= 0 ? '+' : '') + (v - t).toFixed(3) : 'n/a').padStart(10); }
    console.log(line);
  }
  console.log('\nlabels:', JSON.stringify(metrics.labels));
  console.log('\ntacit:', JSON.stringify(metrics.tacitPatterns));
  console.log('\nexplanations:');
  for (const [k, v] of Object.entries(metrics.explanations || {})) console.log(`  [${k}] ${v}`);
}
main().catch(e => { console.error(e); process.exit(1); });
