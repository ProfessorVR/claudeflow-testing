/**
 * Exhaustive search for Aristotle's common sense (koine aisthesis) passages
 * in the ChromaDB knowledge_chunks collection.
 *
 * Uses SmartRetrievalLayer with 8 queries, 16 chunks each, minRelevance 0.1,
 * filtered to Aristotle's works only.
 */

import { SmartRetrievalLayer } from '../src/god-agent/retrieval/smart-retrieval-layer.js';
import type { ContextChunk } from '../src/god-agent/retrieval/types.js';

const srl = new SmartRetrievalLayer({
  chromadb: { host: 'localhost', port: 8001 },
  embeddingApi: { host: 'localhost', port: 8000 },
});

const queries = [
  "common sense koine aisthesis perception unity faculty discriminating",
  "common sensibles motion rest number figure magnitude shared perception",
  "perceiving that we perceive self-awareness consciousness sensation",
  "discrimination between senses sight hearing touch one faculty judges",
  "incidental perception accidental perception we perceive that we see",
  "simultaneous perception judging sweet white different senses unity",
  "sense perception central faculty phantasia imagination common",
  "movement number time perception before after marking off",
];

// Collect all unique chunks across queries
const allChunks = new Map<string, ContextChunk>();
const chunkQueryMap = new Map<string, string[]>();

for (const q of queries) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`QUERY: "${q}"`);
  console.log('='.repeat(80));

  try {
    const chunks = await srl.retrieveContext(q, {
      maxChunks: 16,
      minRelevance: 0.1,
      boostWithKG: true,
      diversityBoost: false, // don't eliminate similar chunks, we want exhaustive coverage
      whereFilter: { author_raw: { $eq: "Aristotle" } },
    });

    console.log(`  Retrieved ${chunks.length} chunks\n`);

    for (const chunk of chunks) {
      const key = chunk.chunkId;
      const author = chunk.metadata?.author || chunk.metadata?.author_raw || 'Unknown';
      const title = chunk.metadata?.title || chunk.metadata?.title_raw || 'Unknown';
      const pageStart = chunk.metadata?.page_start ?? '?';
      const pageEnd = chunk.metadata?.page_end ?? '?';
      const score = chunk.relevanceScore?.toFixed(4) || '?';
      const preview = chunk.content?.substring(0, 400) || '(no content)';

      console.log(`  [${score}] ${author} - ${title}, pp. ${pageStart}-${pageEnd}`);
      console.log(`  ID: ${key}`);
      console.log(`  ${preview}`);
      console.log('');

      if (!allChunks.has(key)) {
        allChunks.set(key, chunk);
        chunkQueryMap.set(key, [q]);
      } else {
        chunkQueryMap.get(key)!.push(q);
      }
    }
  } catch (err) {
    console.error(`  ERROR for query "${q}":`, err);
  }
}

// Summary of unique chunks
console.log(`\n${'#'.repeat(80)}`);
console.log(`SUMMARY: ${allChunks.size} unique Aristotle chunks found across ${queries.length} queries`);
console.log('#'.repeat(80));

// Group by title
const byTitle = new Map<string, ContextChunk[]>();
for (const [, chunk] of allChunks) {
  const title = chunk.metadata?.title || chunk.metadata?.title_raw || 'Unknown';
  if (!byTitle.has(title)) byTitle.set(title, []);
  byTitle.get(title)!.push(chunk);
}

for (const [title, chunks] of byTitle) {
  console.log(`\n--- ${title} (${chunks.length} chunks) ---`);
  // Sort by page
  chunks.sort((a, b) => (a.metadata?.page_start || 0) - (b.metadata?.page_start || 0));
  for (const chunk of chunks) {
    const pageStart = chunk.metadata?.page_start ?? '?';
    const pageEnd = chunk.metadata?.page_end ?? '?';
    const matchedQueries = chunkQueryMap.get(chunk.chunkId) || [];
    console.log(`\n  Pages ${pageStart}-${pageEnd} (matched ${matchedQueries.length} queries: ${matchedQueries.map(q => q.substring(0, 30) + '...').join('; ')})`);
    console.log(`  ID: ${chunk.chunkId}`);
    // Print full content for review
    console.log(`  CONTENT (${chunk.content?.length || 0} chars):`);
    console.log(`  ${chunk.content}`);
  }
}
