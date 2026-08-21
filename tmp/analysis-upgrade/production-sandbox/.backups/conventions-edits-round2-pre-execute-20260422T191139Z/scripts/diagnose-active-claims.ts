#!/usr/bin/env node
/**
 * diagnose-active-claims.ts — Zero-cost diagnostic.
 * For each of the 6 canonical prompts, dump the top-20 claims ranked by the
 * current loadActiveClaims scoring (term-frequency, no length norm). Output
 * per-author counts, score distribution, and searchText-length distribution
 * so we can see whether the topic-invariance hypothesis holds.
 *
 * Usage (from src-worktree):
 *   CORPUS_INDEX_PATH=<sandbox-index> npx tsx ../scripts/diagnose-active-claims.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Replicate scoreCandidate locally so we can also probe variants without
// touching the pipeline code.
function scoreTF(topicTerms: string[], searchText: string): number {
  let score = 0;
  const lower = searchText.toLowerCase();
  for (const t of topicTerms) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const m = lower.match(re);
    if (m) score += m.length;
  }
  return score;
}

// BM25-ish length-normalized variant for comparison.
function scoreBM25(topicTerms: string[], searchText: string, avgdl: number): number {
  const k1 = 1.5, b = 0.75;
  const dl = Math.max(1, searchText.length);
  let score = 0;
  const lower = searchText.toLowerCase();
  for (const t of topicTerms) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const m = lower.match(re);
    const tf = m ? m.length : 0;
    if (tf > 0) {
      score += (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (dl / avgdl)));
    }
  }
  return score;
}

// Log-normalized variant — simpler.
function scoreLogNorm(topicTerms: string[], searchText: string): number {
  const tf = scoreTF(topicTerms, searchText);
  if (tf === 0) return 0;
  return tf / Math.log(2 + searchText.length / 100);
}

interface Claim {
  id: string;
  claim: string;
  quote?: string;
  speaker?: string;
  key_concepts?: string[];
  source?: { author?: string; year?: string | number };
  faithfulness?: string;
  use_mention?: string;
}

function loadClaims(indexPath: string): Claim[] {
  const f = path.join(indexPath, 'compiled-index.json');
  const j = JSON.parse(fs.readFileSync(f, 'utf-8'));
  return j.claims ?? [];
}

function authorKey(c: Claim): string {
  return (c.source?.author ?? c.speaker ?? 'unknown').toLowerCase();
}

function truncate(s: string | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

function run() {
  const indexPath = process.env.CORPUS_INDEX_PATH;
  if (!indexPath) {
    console.error('CORPUS_INDEX_PATH not set');
    process.exit(1);
  }

  const suitePath = path.join(indexPath, '..', '..', 'prompts', 'canonical-suite.json');
  const suite = JSON.parse(fs.readFileSync(suitePath, 'utf-8'));

  const claims = loadClaims(indexPath);
  console.error(`Loaded ${claims.length} claims from ${indexPath}`);

  // avgdl across all claim searchTexts (for BM25)
  const searchTexts = claims.map(c => [c.claim, c.quote, ...(c.key_concepts ?? []), c.speaker].filter(Boolean).join(' '));
  const avgdl = searchTexts.reduce((a, s) => a + s.length, 0) / Math.max(1, searchTexts.length);
  console.error(`avgdl=${avgdl.toFixed(1)}`);

  // Per-author claim count + avg searchText length
  const perAuthor: Record<string, { n: number; avgLen: number }> = {};
  claims.forEach((c, i) => {
    const k = authorKey(c);
    const len = searchTexts[i].length;
    if (!perAuthor[k]) perAuthor[k] = { n: 0, avgLen: 0 };
    perAuthor[k].n += 1;
    perAuthor[k].avgLen += len;
  });
  for (const k of Object.keys(perAuthor)) {
    perAuthor[k].avgLen /= perAuthor[k].n;
  }
  console.error('\n=== Per-author claim inventory ===');
  const authorRows = Object.entries(perAuthor)
    .sort((a, b) => b[1].n - a[1].n);
  for (const [k, v] of authorRows) {
    console.error(`  ${k.padEnd(30)} n=${String(v.n).padStart(4)}  avg_search_len=${v.avgLen.toFixed(0)}`);
  }

  const allowedFaith = ['author-endorsed', 'supported', 'partial'];

  const rows: any[] = [];
  for (const p of suite.prompts) {
    const topic = p.topic;
    const topicTerms = topic.toLowerCase().split(/\s+/).filter((t: string) => t.length >= 4);

    const candidates = claims.map((c, i) => {
      // Replicate default filter gate
      if (c.faithfulness && !allowedFaith.includes(c.faithfulness)) return null;
      const st = searchTexts[i];
      const tf = scoreTF(topicTerms, st);
      if (tf <= 0) return null;
      return {
        id: c.id,
        author: authorKey(c),
        score_tf: tf,
        score_bm25: scoreBM25(topicTerms, st, avgdl),
        score_logn: scoreLogNorm(topicTerms, st),
        stlen: st.length,
        preview: truncate(c.claim, 90),
        faith: c.faithfulness ?? '-',
      };
    }).filter(Boolean) as any[];

    candidates.sort((a, b) => b.score_tf - a.score_tf);

    console.error(`\n=== Prompt: ${p.id} ===`);
    console.error(`topic: ${topic}`);
    console.error(`topic_terms(${topicTerms.length}): ${topicTerms.slice(0, 12).join(', ')}${topicTerms.length > 12 ? '…' : ''}`);
    console.error(`evaluated: ${candidates.length}`);

    // Top-20 by TF
    console.error('--- top-20 by current TF (no length norm) ---');
    for (const c of candidates.slice(0, 20)) {
      console.error(`  ${String(c.score_tf).padStart(3)} tf  ${c.author.padEnd(28)} stlen=${String(c.stlen).padStart(5)}  bm25=${c.score_bm25.toFixed(2).padStart(5)}  ${c.id}`);
    }

    // Author coverage top-20 TF
    const top20TF = candidates.slice(0, 20);
    const authorsTF: Record<string, number> = {};
    for (const c of top20TF) authorsTF[c.author] = (authorsTF[c.author] ?? 0) + 1;
    console.error(`  → top-20 TF author coverage: ${Object.entries(authorsTF).map(([k, v]) => `${k}:${v}`).join(', ')}`);

    // Re-rank by BM25
    const byBM25 = [...candidates].sort((a, b) => b.score_bm25 - a.score_bm25).slice(0, 20);
    const authorsBM25: Record<string, number> = {};
    for (const c of byBM25) authorsBM25[c.author] = (authorsBM25[c.author] ?? 0) + 1;
    console.error(`  → top-20 BM25 author coverage: ${Object.entries(authorsBM25).map(([k, v]) => `${k}:${v}`).join(', ')}`);

    // Re-rank by log-norm
    const byLogN = [...candidates].sort((a, b) => b.score_logn - a.score_logn).slice(0, 20);
    const authorsLogN: Record<string, number> = {};
    for (const c of byLogN) authorsLogN[c.author] = (authorsLogN[c.author] ?? 0) + 1;
    console.error(`  → top-20 LogNorm author coverage: ${Object.entries(authorsLogN).map(([k, v]) => `${k}:${v}`).join(', ')}`);

    rows.push({
      id: p.id,
      evaluated: candidates.length,
      top20_tf_authors: authorsTF,
      top20_bm25_authors: authorsBM25,
      top20_logn_authors: authorsLogN,
    });
  }

  // Dump as JSON to stdout for programmatic post-analysis
  console.log(JSON.stringify({ avgdl, perAuthor, prompts: rows }, null, 2));
}

run();
