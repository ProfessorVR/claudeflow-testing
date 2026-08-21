#!/usr/bin/env node
/**
 * corpus-ingest.mjs — ingest a folder of documents into the local corpus
 * (ChromaDB, via the embedding API on :8000) so FCDP pack assembly can search
 * them and pull verifiable quotes/passages.
 *
 *   node scripts/corpus-ingest.mjs <folder> [--dry-run] [--chunk 1200]
 *   node scripts/corpus-ingest.mjs --search "your query" [--n 8]
 *
 * Supports .pdf (text-based; extracted with `pdftotext`), .txt, and .md.
 * Requires the embedding server running (setup guide, Part E):  http://127.0.0.1:8000
 */
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { execFileSync } from 'child_process';

const API = process.env.EMBED_API || 'http://127.0.0.1:8000';
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const has = (n) => args.includes(n);
const CHUNK = parseInt(flag('--chunk', '1200'), 10);
const DRY = has('--dry-run');

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (['.pdf', '.txt', '.md'].includes(extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

function extractText(file) {
  const ext = extname(file).toLowerCase();
  if (ext === '.pdf') {
    try { return execFileSync('pdftotext', ['-q', file, '-'], { maxBuffer: 64 * 1024 * 1024, encoding: 'utf-8' }); }
    catch (e) { console.error(`  ! pdftotext failed for ${basename(file)} (scanned image? no text layer): ${e.message}`); return ''; }
  }
  return readFileSync(file, 'utf-8');
}

/** Split text into ~CHUNK-char chunks on paragraph boundaries. */
function chunkText(text) {
  const paras = text.replace(/\r/g, '').split(/\n\s*\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + ' ' + p).length > CHUNK && buf) { chunks.push(buf.trim()); buf = p; }
    else buf = buf ? buf + ' ' + p : p;
  }
  if (buf.trim()) chunks.push(buf.trim());
  return chunks.filter(c => c.length > 40);
}

async function postJSON(path, body) {
  const res = await fetch(API + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function ingest(folder) {
  const files = walk(folder);
  if (!files.length) { console.error(`No .pdf/.txt/.md files under ${folder}`); process.exit(1); }
  console.log(`Ingesting ${files.length} file(s) from ${folder}  (chunk≈${CHUNK} chars)${DRY ? '  [DRY RUN — no writes]' : ''}\n`);
  let total = 0;
  for (const file of files) {
    const text = extractText(file);
    const chunks = chunkText(text);
    console.log(`  ${basename(file).padEnd(48)} ${String(chunks.length).padStart(4)} chunks`);
    total += chunks.length;
    if (DRY) continue;
    const B = 16;
    for (let i = 0; i < chunks.length; i += B) {
      const batch = chunks.slice(i, i + B);
      const metadata = batch.map((_, j) => ({ source: basename(file), path: file, chunk_index: i + j }));
      await postJSON('/embed', { texts: batch, metadata, kind: 'document' });
    }
  }
  console.log(`\n${DRY ? 'Would ingest' : 'Ingested'} ${total} chunks from ${files.length} file(s).`);
  if (!DRY) console.log(`Search them with:  node scripts/corpus-ingest.mjs --search "your query"`);
}

async function search(query) {
  const n = parseInt(flag('--n', '8'), 10);
  const r = await postJSON('/search', { query, n_results: n });
  const docs = r.results?.documents?.[0] || r.results?.documents || [];
  const metas = r.results?.metadatas?.[0] || r.results?.metadatas || [];
  const dist = r.results?.distances?.[0] || r.results?.distances || [];
  console.log(`\nTop ${docs.length} matches for: "${query}"\n`);
  docs.forEach((d, i) => {
    const src = metas[i]?.source || '?';
    const sim = dist[i] != null ? (1 - dist[i] / 2).toFixed(3) : 'n/a';
    console.log(`[${i + 1}] ${src}  (sim≈${sim})`);
    console.log(`    ${String(d).slice(0, 280).replace(/\s+/g, ' ')}…\n`);
  });
}

async function main() {
  const searchQuery = flag('--search', null);
  if (searchQuery) return search(searchQuery);
  const folder = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--chunk' && args[args.indexOf(a) - 1] !== '--n');
  if (!folder) {
    console.error('usage: node scripts/corpus-ingest.mjs <folder> [--dry-run] [--chunk 1200]');
    console.error('       node scripts/corpus-ingest.mjs --search "query" [--n 8]');
    process.exit(1);
  }
  return ingest(folder);
}
main().catch(e => { console.error('ERROR:', e.message); console.error(`(is the embedding server running? ${API})`); process.exit(1); });
