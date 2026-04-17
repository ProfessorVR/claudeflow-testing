/**
 * F2.5: Prompt ablation test.
 * Compares rubric-only vs rubric-plus-few-shot on 15 passages.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildSystemPrompt, buildUserPrompt, parseJudgment } from './rubric.js';

const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const API_KEY = process.env.ANTHROPIC_API_KEY!;

async function callClaude(system: string, user: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6', max_tokens: 800, temperature: 0,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  const data = await response.json() as any;
  return data.content?.[0]?.text || '';
}

async function main() {
  const corpus = readFileSync(resolve(process.cwd(), 'data/expansion-corpus.jsonl'), 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  // Select 15 passages stratified by genre
  const genres = [...new Set(corpus.map((e: any) => e.genre))];
  const selected: any[] = [];
  for (const g of genres) {
    const gEntries = corpus.filter((e: any) => e.genre === g);
    selected.push(gEntries[0]); // first from each genre
    if (selected.length >= 15) break;
  }
  // Fill remaining from largest genres
  while (selected.length < 15) {
    const remaining = corpus.filter((e: any) => !selected.find((s: any) => s.id === e.id));
    if (remaining.length === 0) break;
    selected.push(remaining[Math.floor(remaining.length / 2)]);
  }

  const withFewShot = buildSystemPrompt(true);
  const withoutFewShot = buildSystemPrompt(false);
  const axes = ['nounVerb', 'parataxisHypotaxis', 'periodicRunning', 'voice', 'primaryRegister', 'opacity'];

  const fewShotLabels: Record<string, string[]> = {};
  const noFewShotLabels: Record<string, string[]> = {};
  for (const a of axes) { fewShotLabels[a] = []; noFewShotLabels[a] = []; }

  console.log(`=== F2.5: Prompt Ablation Test (${selected.length} passages) ===\n`);

  for (let i = 0; i < selected.length; i++) {
    const entry = selected[i];
    const userPrompt = buildUserPrompt(entry.text);
    process.stdout.write(`[${i+1}/${selected.length}] ${entry.id}...`);

    try {
      const [r1, r2] = await Promise.all([
        callClaude(withFewShot, userPrompt),
        callClaude(withoutFewShot, userPrompt),
      ]);
      const j1 = parseJudgment(r1);
      const j2 = parseJudgment(r2);

      if (j1 && j2) {
        for (const a of axes) {
          fewShotLabels[a].push(j1.axes[a]?.label || '');
          noFewShotLabels[a].push(j2.axes[a]?.label || '');
        }
        console.log(' OK');
      } else {
        console.log(' PARSE ERROR');
      }
    } catch (err: any) {
      console.log(` ERROR: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  // Compare distributions
  console.log('\n=== Distribution Comparison ===\n');
  for (const axis of axes) {
    const fs = fewShotLabels[axis];
    const nfs = noFewShotLabels[axis];
    const allLabels = [...new Set([...fs, ...nfs])];

    let maxDiff = 0;
    const diffs: string[] = [];
    for (const label of allLabels) {
      const fsRate = fs.filter(l => l === label).length / fs.length;
      const nfsRate = nfs.filter(l => l === label).length / nfs.length;
      const diff = Math.abs(fsRate - nfsRate);
      maxDiff = Math.max(maxDiff, diff);
      diffs.push(`${label.slice(0,20).padEnd(22)} FS=${(fsRate*100).toFixed(0)}% noFS=${(nfsRate*100).toFixed(0)}% Δ=${(diff*100).toFixed(0)}%`);
    }

    const status = maxDiff < 0.10 ? 'LOW (<10%)' : maxDiff < 0.20 ? 'MODERATE (10-20%)' : 'HIGH (>20%)';
    console.log(`${axis.padEnd(22)} anchoring: ${status}`);
    for (const d of diffs) console.log(`  ${d}`);
    console.log('');
  }

  // Agreement between variants
  let totalAgree = 0, totalCompare = 0;
  for (const axis of axes) {
    const fs = fewShotLabels[axis];
    const nfs = noFewShotLabels[axis];
    for (let i = 0; i < Math.min(fs.length, nfs.length); i++) {
      if (fs[i] === nfs[i]) totalAgree++;
      totalCompare++;
    }
  }
  console.log(`Overall variant agreement: ${totalAgree}/${totalCompare} (${(totalAgree/totalCompare*100).toFixed(1)}%)`);
}

main().catch(e => { console.error(e); process.exit(1); });
