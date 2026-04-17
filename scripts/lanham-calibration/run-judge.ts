/**
 * F3: Run Claude-as-judge on the expansion corpus.
 *
 * Usage:
 *   npx tsx scripts/lanham-calibration/run-judge.ts [--limit N] [--determinism-check]
 *
 * Reads: data/expansion-corpus.jsonl
 * Writes: data/expansion-labels.jsonl
 * Requires: ANTHROPIC_API_KEY in .env
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { resolve } from 'path';
import { buildSystemPrompt, buildUserPrompt, parseJudgment, type LanhamJudgment } from './rubric.js';

// Load .env manually (no dotenv dependency)
const envContent = readFileSync(resolve(process.cwd(), '.env'), 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not found in environment or .env');
  process.exit(1);
}

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 800;
const RATE_LIMIT_MS = 500; // 500ms between requests to stay under rate limits

interface CorpusEntry {
  id: string;
  genre: string;
  text: string;
  source: string;
  period?: string;
  word_count?: number;
}

interface LabeledEntry {
  id: string;
  genre: string;
  claude_labels: Record<string, string>;
  claude_confidence: Record<string, number>;
  claude_justifications: Record<string, string>;
  raw_response?: string;
  error?: string;
}

async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  retries: number = 3,
): Promise<string> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          temperature: 0,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 429 || response.status === 529) {
          // Rate limited or overloaded — wait and retry
          const waitMs = (attempt + 1) * 5000;
          console.log(`  Rate limited (${response.status}), waiting ${waitMs}ms...`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        }
        throw new Error(`API error ${response.status}: ${errText}`);
      }

      const data = await response.json() as any;
      const text = data.content?.[0]?.text || '';
      return text;
    } catch (err: any) {
      if (attempt < retries - 1) {
        console.log(`  Retry ${attempt + 1}/${retries}: ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
  throw new Error('All retries exhausted');
}

function extractLabels(judgment: LanhamJudgment): LabeledEntry['claude_labels'] {
  const labels: Record<string, string> = {};
  for (const [axis, data] of Object.entries(judgment.axes)) {
    labels[axis] = data.label;
  }
  return labels;
}

function extractConfidence(judgment: LanhamJudgment): LabeledEntry['claude_confidence'] {
  const conf: Record<string, number> = {};
  for (const [axis, data] of Object.entries(judgment.axes)) {
    conf[axis] = data.confidence;
  }
  return conf;
}

function extractJustifications(judgment: LanhamJudgment): LabeledEntry['claude_justifications'] {
  const just: Record<string, string> = {};
  for (const [axis, data] of Object.entries(judgment.axes)) {
    just[axis] = data.justification;
  }
  return just;
}

async function main() {
  // Parse CLI args
  let limit = Infinity;
  let determinismCheck = false;
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--limit' && i + 1 < process.argv.length) {
      limit = parseInt(process.argv[++i], 10);
    }
    if (process.argv[i] === '--determinism-check') {
      determinismCheck = true;
    }
  }

  const corpusPath = resolve(process.cwd(), 'data/expansion-corpus.jsonl');
  const outputPath = resolve(process.cwd(), 'data/expansion-labels.jsonl');

  if (!existsSync(corpusPath)) {
    console.error('Corpus not found:', corpusPath);
    process.exit(1);
  }

  const entries: CorpusEntry[] = readFileSync(corpusPath, 'utf-8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l));

  console.log(`=== F3: Claude-as-Judge Labeling ===`);
  console.log(`Corpus: ${entries.length} passages`);
  console.log(`Model: ${MODEL}`);
  console.log(`Temperature: 0`);
  console.log(`Limit: ${limit === Infinity ? 'all' : limit}`);
  console.log('');

  const systemPrompt = buildSystemPrompt(true);
  console.log(`System prompt: ${systemPrompt.length} chars`);

  // Load already-processed IDs to support resuming
  const processedIds = new Set<string>();
  if (existsSync(outputPath)) {
    const existing = readFileSync(outputPath, 'utf-8').split('\n').filter(l => l.trim());
    for (const line of existing) {
      try {
        const entry = JSON.parse(line);
        processedIds.add(entry.id);
      } catch { /* skip malformed */ }
    }
    console.log(`Resuming: ${processedIds.size} already processed`);
  }

  const toProcess = entries
    .filter(e => !processedIds.has(e.id))
    .slice(0, limit);

  console.log(`To process: ${toProcess.length} passages`);
  console.log('');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const entry = toProcess[i];
    const progress = `[${i + 1}/${toProcess.length}]`;

    try {
      const userPrompt = buildUserPrompt(entry.text);
      const rawResponse = await callClaude(systemPrompt, userPrompt);
      const judgment = parseJudgment(rawResponse);

      if (!judgment) {
        console.log(`${progress} ${entry.id} — PARSE ERROR`);
        const errorEntry: LabeledEntry = {
          id: entry.id,
          genre: entry.genre,
          claude_labels: {},
          claude_confidence: {},
          claude_justifications: {},
          raw_response: rawResponse,
          error: 'Failed to parse JSON response',
        };
        appendFileSync(outputPath, JSON.stringify(errorEntry) + '\n');
        errorCount++;
        continue;
      }

      const labeled: LabeledEntry = {
        id: entry.id,
        genre: entry.genre,
        claude_labels: extractLabels(judgment),
        claude_confidence: extractConfidence(judgment),
        claude_justifications: extractJustifications(judgment),
      };

      appendFileSync(outputPath, JSON.stringify(labeled) + '\n');
      successCount++;

      const labelSummary = Object.entries(labeled.claude_labels)
        .map(([k, v]) => `${k.slice(0, 4)}=${v.slice(0, 12)}`)
        .join(' ');
      console.log(`${progress} ${entry.id} — OK (${labelSummary})`);

    } catch (err: any) {
      console.log(`${progress} ${entry.id} — ERROR: ${err.message}`);
      const errorEntry: LabeledEntry = {
        id: entry.id,
        genre: entry.genre,
        claude_labels: {},
        claude_confidence: {},
        claude_justifications: {},
        error: err.message,
      };
      appendFileSync(outputPath, JSON.stringify(errorEntry) + '\n');
      errorCount++;
    }

    // Rate limiting
    if (i < toProcess.length - 1) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  console.log('');
  console.log(`=== Complete ===`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Output: ${outputPath}`);

  // Determinism check
  if (determinismCheck) {
    console.log('');
    console.log('=== Determinism Check ===');
    const checkEntries = entries.slice(0, 10);
    let agreements = 0;
    let total = 0;

    for (const entry of checkEntries) {
      const userPrompt = buildUserPrompt(entry.text);
      const response1 = await callClaude(systemPrompt, userPrompt);
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
      const response2 = await callClaude(systemPrompt, userPrompt);

      const j1 = parseJudgment(response1);
      const j2 = parseJudgment(response2);

      if (j1 && j2) {
        let match = true;
        for (const axis of Object.keys(j1.axes)) {
          if (j1.axes[axis]?.label !== j2.axes[axis]?.label) {
            console.log(`  UNSTABLE: ${entry.id} axis=${axis} run1="${j1.axes[axis]?.label}" run2="${j2.axes[axis]?.label}"`);
            match = false;
          }
        }
        if (match) agreements++;
        total++;
      }

      await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
    }

    const rate = total > 0 ? (agreements / total * 100).toFixed(1) : '0';
    console.log(`Determinism: ${agreements}/${total} passages fully stable (${rate}%)`);
    if (parseFloat(rate) < 95) {
      console.log('WARNING: Determinism below 95% — flagged passages need adjudication');
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
