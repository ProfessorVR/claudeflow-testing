/**
 * Exhaustive search for Aristotle's common sense (koine aisthesis) passages.
 *
 * Strategy:
 * 1. Retrieve ALL Aristotle chunks from ChromaDB (569 total)
 * 2. Run keyword/regex filtering for common-sense-related terms
 * 3. Also run SRL semantic queries focused on De Anima/De Sensu
 * 4. Merge and deduplicate
 */

const CHROMA_URL = 'http://localhost:8001';
const COLLECTION_ID = '2351bc36-0847-4071-ac16-31da2b634a22';
const BASE = `${CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${COLLECTION_ID}`;

interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  matchedTerms: string[];
  source: string; // 'keyword' | 'semantic' | 'both'
}

// Fetch all Aristotle chunks in batches
async function fetchAllAristotleChunks(): Promise<{ ids: string[]; documents: string[]; metadatas: Record<string, any>[] }> {
  const allIds: string[] = [];
  const allDocs: string[] = [];
  const allMetas: Record<string, any>[] = [];

  let offset = 0;
  const limit = 200;

  while (true) {
    const resp = await fetch(`${BASE}/get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        where: { author_raw: { $eq: 'Aristotle' } },
        include: ['documents', 'metadatas'],
        limit,
        offset,
      }),
    });

    const data = await resp.json();
    if (!data.ids || data.ids.length === 0) break;

    allIds.push(...data.ids);
    allDocs.push(...data.documents);
    allMetas.push(...data.metadatas);

    if (data.ids.length < limit) break;
    offset += limit;
  }

  return { ids: allIds, documents: allDocs, metadatas: allMetas };
}

// Keywords and patterns relevant to koine aisthesis / common sense
const SEARCH_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'common sense', pattern: /common\s+sense/i },
  { label: 'common sensibles', pattern: /common\s+sensibl/i },
  { label: 'koine aisthesis', pattern: /koin[eē]\s+aisth[eē]s/i },
  { label: 'koina aistheta', pattern: /koina\s+aisth[eē]t/i },
  { label: 'common objects of sense', pattern: /common\s+object[s]?\s+of\s+sense/i },
  { label: 'perceive that we perceive', pattern: /perceiv[e(ing)]+\s+that\s+we\s+perceive/i },
  { label: 'we perceive that we see', pattern: /we\s+perceive\s+that\s+we\s+see/i },
  { label: 'perceive that we see', pattern: /perceive\s+that\s+we\s+see/i },
  { label: 'sense perceives itself', pattern: /sense\s+perceiv[es]+\s+itself/i },
  { label: 'discrimination/discriminate senses', pattern: /discriminat[eion]+.*sense/i },
  { label: 'discern/judge between senses', pattern: /(discern|judg[eing]+).*between.*(sense|white|sweet|bitter)/i },
  { label: 'one faculty judges', pattern: /one\s+(faculty|sense|thing)\s+(judg|discrim|discern)/i },
  { label: 'central sense/sensorium', pattern: /(central\s+sense|sensorium|primary\s+sense)/i },
  { label: 'incidental perception', pattern: /incidental\s+perception/i },
  { label: 'accidental perception', pattern: /accidental[ly]*\s+percei/i },
  { label: 'per accidens perception', pattern: /per\s+accidens.*percei/i },
  { label: 'perceive white and sweet together', pattern: /(white|sweet).*(perceiv|judg|discrim|sense).*(sweet|white)/i },
  { label: 'unity of perception', pattern: /unity\s+(of\s+)?percep/i },
  { label: 'simultaneous perception', pattern: /simultaneou[s(ly)]*\s+percei/i },
  { label: 'phantasia/imagination', pattern: /phantasia|phantasm|imagination.*sense/i },
  { label: 'movement/motion figure magnitude', pattern: /motion.*magnitude|magnitude.*motion|figure.*magnitude|motion.*figure/i },
  { label: 'common to all senses', pattern: /common\s+to\s+(all\s+)?([a-z]+\s+)?sense/i },
  { label: 'movement rest number figure magnitude', pattern: /(movement|motion|rest|number|figure|magnitude).*common/i },
  { label: 'proper objects/proper sensibles', pattern: /proper\s+(object|sensibl)/i },
  { label: 'special objects of sense', pattern: /special\s+object.*sense|special\s+sensibl/i },
  { label: 'each sense has proper object', pattern: /each\s+sense.*proper|proper.*each\s+sense/i },
  { label: 'perceive by more than one sense', pattern: /perceive.*more\s+than\s+one\s+sense/i },
  { label: 'master sense', pattern: /master\s+sense|ruling\s+sense|controlling\s+sense/i },
  { label: 'the senses judge', pattern: /the\s+sense[s]?\s+judge|sense\s+is\s+a\s+kind\s+of\s+judg/i },
  { label: 'sense organ common', pattern: /sense[\s-]organ.*common|common.*sense[\s-]organ/i },
  { label: 'number and time via sense', pattern: /(number|time).*(sense|percei)/i },
  { label: 'before and after in perception', pattern: /before\s+and\s+after.*(percei|sense|time)/i },
  { label: 'touch is the basis', pattern: /touch.*basis|touch.*fundamental|fundamental.*touch/i },
  { label: 'perceiving time/number', pattern: /perceiv.*time|perceiv.*number/i },
  { label: 'sweet is white (cross-modal)', pattern: /(sweet\s+is\s+white|white\s+is\s+sweet|sweet.*white.*different)/i },
  { label: 'self-perception/reflexive', pattern: /sense.*itself|itself.*sens[eation]/i },
];

async function main() {
  console.log('Fetching all Aristotle chunks from ChromaDB...');
  const { ids, documents, metadatas } = await fetchAllAristotleChunks();
  console.log(`Total Aristotle chunks: ${ids.length}\n`);

  // Count by title
  const titleCounts: Record<string, number> = {};
  for (const m of metadatas) {
    const t = m.title_raw || '?';
    titleCounts[t] = (titleCounts[t] || 0) + 1;
  }
  console.log('Works in corpus:');
  for (const [t, c] of Object.entries(titleCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c.toString().padStart(4)}  ${t}`);
  }
  console.log('');

  // Keyword search across all chunks
  const matches = new Map<string, ChunkResult>();

  for (let i = 0; i < ids.length; i++) {
    const content = documents[i] || '';
    const meta = metadatas[i] || {};
    const matchedTerms: string[] = [];

    for (const { label, pattern } of SEARCH_PATTERNS) {
      if (pattern.test(content)) {
        matchedTerms.push(label);
      }
    }

    if (matchedTerms.length > 0) {
      matches.set(ids[i], {
        id: ids[i],
        content,
        metadata: meta,
        matchedTerms,
        source: 'keyword',
      });
    }
  }

  console.log(`\nKeyword search found ${matches.size} chunks with common-sense-related terms.\n`);

  // Group by title and sort by page
  const byTitle = new Map<string, ChunkResult[]>();
  for (const [, chunk] of matches) {
    const title = chunk.metadata.title_raw || '?';
    if (!byTitle.has(title)) byTitle.set(title, []);
    byTitle.get(title)!.push(chunk);
  }

  // Prioritize De Anima, Sense and Sensibilia, On Memory, then others
  const priorityOrder = [
    'On The Soul (De Anima)',
    'Sense And Sensibilia',
    'On Memory',
    'Movement Of Animals',
    'Physics',
    'Metaphysics',
    'Rhetoric',
    'On Colours',
    'On Things Heard',
  ];

  console.log('='.repeat(100));
  console.log('RELEVANT ARISTOTLE PASSAGES ON COMMON SENSE (koine aisthesis)');
  console.log('='.repeat(100));

  let passageNum = 0;

  for (const titleKey of priorityOrder) {
    const chunks = byTitle.get(titleKey);
    if (!chunks || chunks.length === 0) continue;

    // Sort by page_start
    chunks.sort((a, b) => (a.metadata.page_start || 0) - (b.metadata.page_start || 0));

    // Deduplicate: some chunks exist as both "My Copy" and clean copy
    const seen = new Set<string>();
    const deduped: ChunkResult[] = [];
    for (const c of chunks) {
      // Use content hash to dedup
      const contentKey = c.content.substring(0, 200);
      if (!seen.has(contentKey)) {
        seen.add(contentKey);
        deduped.push(c);
      }
    }

    console.log(`\n${'#'.repeat(100)}`);
    console.log(`# ${titleKey} (${deduped.length} unique passages)`);
    console.log('#'.repeat(100));

    for (const chunk of deduped) {
      passageNum++;
      const ps = chunk.metadata.page_start ?? '?';
      const pe = chunk.metadata.page_end ?? '?';
      const pageStr = ps === pe ? `p. ${ps}` : `pp. ${ps}-${pe}`;

      console.log(`\n--- Passage ${passageNum}: ${titleKey}, ${pageStr} ---`);
      console.log(`Chunk ID: ${chunk.id}`);
      console.log(`Matched terms: ${chunk.matchedTerms.join(', ')}`);
      console.log(`Content (${chunk.content.length} chars):`);
      console.log(chunk.content);
    }
  }

  console.log(`\n${'='.repeat(100)}`);
  console.log(`TOTAL: ${passageNum} unique passages across all Aristotle works`);
  console.log('='.repeat(100));
}

main().catch(console.error);
