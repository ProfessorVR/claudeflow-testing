/**
 * F1 GATE: Validate rubric on 5 gold set passages.
 * Passes if Claude labels match gold labels on >=4/5 per axis.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { buildSystemPrompt, buildUserPrompt, parseJudgment } from './rubric.js';

// Load .env manually (no dotenv dependency)
const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found');
  process.exit(1);
}

interface GoldEntry {
  id: string;
  genre: string;
  text: string;
  labels: Record<string, string>;
}

async function callClaude(system: string, user: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      temperature: 0,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json() as any;
  return data.content?.[0]?.text || '';
}

async function main() {
  const goldPath = resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl');
  const entries: GoldEntry[] = readFileSync(goldPath, 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  // Select 5 diverse passages (not the 3 used in few-shot examples)
  const testIds = [
    'lanham_ch1_dean',        // balanced, mixed, running, moderate, middle, transparent
    'lanham_ch1_miller',      // verb, mixed, running, voiced, middle, mixed opacity
    'lanham_ch5_fedregister', // noun, hypo, periodic, unvoiced, high, transparent
    'lanham_ch3_bible',       // verb, para, running, voiced, low, transparent
    'lanham_ch8_mencken',     // verb, para, running, voiced, low, opaque
  ];

  const testEntries = entries.filter(e => testIds.includes(e.id));

  console.log('=== F1 GATE: Rubric Validation ===');
  console.log(`Testing ${testEntries.length} gold set passages (not in few-shot examples)`);
  console.log('');

  const systemPrompt = buildSystemPrompt(true);
  const axes = ['nounVerb', 'parataxisHypotaxis', 'periodicRunning', 'voice', 'primaryRegister', 'opacity'];
  const axisAgreement: Record<string, number> = {};
  for (const a of axes) axisAgreement[a] = 0;

  for (const entry of testEntries) {
    const userPrompt = buildUserPrompt(entry.text);
    console.log(`${entry.id}:`);

    try {
      const response = await callClaude(systemPrompt, userPrompt);
      const judgment = parseJudgment(response);

      if (!judgment) {
        console.log('  PARSE FAILED');
        continue;
      }

      for (const axis of axes) {
        const goldLabel = entry.labels[axis];
        const claudeLabel = judgment.axes[axis]?.label;
        const match = goldLabel === claudeLabel;
        if (match) axisAgreement[axis]++;
        const confidence = judgment.axes[axis]?.confidence?.toFixed(2) || '?';
        console.log(`  ${axis.padEnd(22)} gold="${goldLabel?.padEnd(25) || '?'}" claude="${claudeLabel?.padEnd(25) || '?'}" conf=${confidence} ${match ? 'MATCH' : 'MISS'}`);
      }
    } catch (err: any) {
      console.log(`  ERROR: ${err.message}`);
    }

    console.log('');
    await new Promise(r => setTimeout(r, 1000));
  }

  // Report
  console.log('=== Per-Axis Agreement (out of 5) ===');
  let allPass = true;
  for (const axis of axes) {
    const count = axisAgreement[axis];
    const status = count >= 4 ? 'PASS' : 'FAIL';
    if (count < 4) allPass = false;
    console.log(`  ${axis.padEnd(22)} ${count}/5 ${status}`);
  }
  console.log('');
  console.log(`Overall: ${allPass ? 'PASS (all axes >=4/5)' : 'FAIL (some axes <4/5)'}`);
}

main().catch(e => { console.error(e); process.exit(1); });
