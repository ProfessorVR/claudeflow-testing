/**
 * Phase 1 acceptance harness — rerank wiring A/B.
 *
 * Runs retrieveContext() on fixed dissertation queries with rerank OFF vs ON and prints
 * both top-10 lists with scores. Writes a markdown report to tmp/rerank-ab-<date>.md.
 *
 * Usage:
 *   npx tsx scripts/test-rerank-wiring.ts
 *   GOD_RERANK_ENABLED=false npx tsx scripts/test-rerank-wiring.ts   # degradation: on==off
 *   GOD_RERANK_ENDPOINT=http://192.168.50.22:8100/v1/rerank npx tsx scripts/test-rerank-wiring.ts
 *
 * Expectations:
 *   - rerank-OFF output identical to pre-change behavior.
 *   - rerank-ON reorders at least some queries when the reranker is reachable.
 *   - reranker down => rerank-ON identical to rerank-OFF, one warning, no crash.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { SmartRetrievalLayer } from '../src/god-agent/retrieval/smart-retrieval-layer.js';

const QUERIES = [
  'world-disclosedness in virtual environments',
  "profound boredom in Heidegger's Fundamental Concepts of Metaphysics",
  'rhetorical incorporation and player agency in Red Dead Redemption 2',
  "phantasia and imagination in Aristotle's De Anima",
  "Burke's pentad and identification in game analysis",
];

interface Row {
  rank: number;
  chunkId: string;
  score: number;
  retrievalScore?: number;
  author: string;
  title: string;
}

async function runConfig(
  layer: SmartRetrievalLayer,
  query: string,
  rerank: boolean
): Promise<Row[]> {
  const chunks = await layer.retrieveContext(query, {
    maxChunks: 10,
    minRelevance: 0.35,
    rerank,
    diversityBoost: true,
  });
  return chunks.map((c, i) => ({
    rank: i + 1,
    chunkId: c.chunkId,
    score: Number(c.relevanceScore.toFixed(4)),
    retrievalScore: c.retrievalScore !== undefined ? Number(c.retrievalScore.toFixed(4)) : undefined,
    author: c.metadata?.author ?? '?',
    title: (c.metadata?.title ?? '?').slice(0, 40),
  }));
}

/** Count how many chunkIds changed rank position between two ordered lists. */
function orderingDelta(off: Row[], on: Row[]): { moved: number; setChanged: number } {
  const offPos = new Map(off.map((r) => [r.chunkId, r.rank]));
  let moved = 0;
  for (const r of on) {
    const prev = offPos.get(r.chunkId);
    if (prev === undefined || prev !== r.rank) moved++;
  }
  const offSet = new Set(off.map((r) => r.chunkId));
  const setChanged = on.filter((r) => !offSet.has(r.chunkId)).length;
  return { moved, setChanged };
}

function fmt(rows: Row[]): string {
  if (rows.length === 0) return '  (no results)\n';
  return rows
    .map(
      (r) =>
        `  ${String(r.rank).padStart(2)}. ${r.score.toFixed(4)}` +
        `${r.retrievalScore !== undefined ? ` (ret ${r.retrievalScore.toFixed(4)})` : ''}` +
        `  ${r.author} — ${r.title}  [${r.chunkId.slice(0, 12)}]`
    )
    .join('\n') + '\n';
}

async function main() {
  const enabled = process.env.GOD_RERANK_ENABLED ?? '(default true)';
  const endpoint = process.env.GOD_RERANK_ENDPOINT ?? '(default WRAITH :8100)';
  const md: string[] = [
    `# Rerank wiring A/B — ${new Date().toISOString()}`,
    ``,
    `- GOD_RERANK_ENABLED = ${enabled}`,
    `- GOD_RERANK_ENDPOINT = ${endpoint}`,
    ``,
  ];

  const layer = new SmartRetrievalLayer();
  let anyReordered = false;

  for (const query of QUERIES) {
    console.log(`\n=== ${query} ===`);
    let off: Row[] = [];
    let on: Row[] = [];
    try {
      off = await runConfig(layer, query, false);
      on = await runConfig(layer, query, true);
    } catch (err) {
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
      md.push(`## ${query}\n\n**ERROR:** ${err}\n`);
      continue;
    }
    const delta = orderingDelta(off, on);
    if (delta.moved > 0) anyReordered = true;

    console.log('  -- rerank OFF --');
    console.log(fmt(off));
    console.log('  -- rerank ON --');
    console.log(fmt(on));
    console.log(`  ordering delta: ${delta.moved}/10 positions changed, ${delta.setChanged} new chunks`);

    md.push(
      `## ${query}`,
      ``,
      `ordering delta: **${delta.moved}/10** positions changed, **${delta.setChanged}** new chunks vs OFF`,
      ``,
      `### rerank OFF`,
      '```',
      fmt(off).trimEnd(),
      '```',
      `### rerank ON`,
      '```',
      fmt(on).trimEnd(),
      '```',
      ``
    );
  }

  md.push(
    `---`,
    ``,
    anyReordered
      ? `**Result:** rerank-ON reordered at least one query — reranker is live and active.`
      : `**Result:** NO reordering across any query — reranker is disabled/unreachable (degradation path) OR ordering coincidentally identical.`
  );

  mkdirSync('tmp', { recursive: true });
  const date = new Date().toISOString().slice(0, 10);
  const outPath = `tmp/rerank-ab-${date}.md`;
  writeFileSync(outPath, md.join('\n'));
  console.log(`\nWrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
