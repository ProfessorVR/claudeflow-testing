/**
 * Targeted search for Aristotle's common sense (koine aisthesis) passages.
 *
 * Tier 1 (HIGH): Direct mentions of common sense doctrine terms
 * Tier 2 (MEDIUM): Discussion of cross-modal perception, discrimination between senses
 * Tier 3 (LOW): Related passages about phantasia, proper/special sensibles
 *
 * Filters aggressively to find only genuinely relevant passages.
 */

const CHROMA_URL = 'http://localhost:8001';
const COLLECTION_ID = '2351bc36-0847-4071-ac16-31da2b634a22';
const BASE = `${CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/${COLLECTION_ID}`;

interface ChunkResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  matchedTerms: string[];
  tier: 1 | 2 | 3;
  score: number;
}

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

// TIER 1: Direct common-sense doctrine terms (score: 10 each)
const TIER1_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'common sense (exact)', pattern: /common\s+sense/i },
  { label: 'common sensibles', pattern: /common\s+sensibl/i },
  { label: 'common objects of sense', pattern: /common\s+objects?\s+of\s+(the\s+)?sense/i },
  { label: 'perceive that we perceive', pattern: /perceiv\w*\s+that\s+we\s+perceiv/i },
  { label: 'we perceive that we see/hear', pattern: /we\s+perceiv\w*\s+that\s+we\s+(see|hear|touch|smell|taste)/i },
  { label: 'perception of perceiving', pattern: /percep\w*\s+of\s+percei/i },
  { label: 'sense perceives itself', pattern: /sense\s+perceiv\w*\s+itself/i },
  { label: 'incidental/accidental perception', pattern: /(incidental|accidental)\w*\s+percep/i },
  { label: 'per accidens + sense/perceive', pattern: /per\s+accidens/i },
  { label: 'movement rest number figure magnitude (as sensibles)', pattern: /(movement|motion|rest|number|figure|magnitude)\s*(,\s*(movement|motion|rest|number|figure|magnitude))+/i },
  { label: 'common to more than one sense', pattern: /common\s+to\s+(more\s+than\s+one|all|several|the)\s+sense/i },
  { label: 'the sensorium', pattern: /\bsensorium\b/i },
  { label: 'central/primary organ of sense', pattern: /(central|primary|chief|controlling|master)\s+(organ|faculty|sense)/i },
  { label: 'proper sensibles', pattern: /proper\s+sensibl/i },
  { label: 'special sensibles/objects', pattern: /special\s+(sensibl|object)/i },
];

// TIER 2: Cross-modal perception, discrimination, unity (score: 5 each)
const TIER2_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'discriminate/distinguish between senses', pattern: /(discriminat|distinguish)\w*\s*(between|among|the)\s*(different\s+)?(sense|qualit)/i },
  { label: 'one thing judges/discriminates', pattern: /one\s+(thing|faculty|sense|power)\s*(that\s+)?(judge|discriminat|discern|pronounce)/i },
  { label: 'sweet and white (cross-modal)', pattern: /sweet\s+(and|from|is)\s+white|white\s+(and|from|is)\s+sweet/i },
  { label: 'simultaneous perception different qualities', pattern: /simultaneous\w*\s+percei/i },
  { label: 'perceive two things at once', pattern: /perceive\s+two\s+thing/i },
  { label: 'unity of perception', pattern: /unity\s+(of\s+)?percep/i },
  { label: 'each sense judges', pattern: /each\s+sense\s*(judge|discrim|pronounce)/i },
  { label: 'phantasia from sense', pattern: /phantasia/i },
  { label: 'perceive by sight that it is sweet', pattern: /perceive\s+by\s+(sight|touch|hearing)/i },
  { label: 'sense is a kind of ratio/proportion', pattern: /sense\s+is\s+a\s+(kind\s+of\s+)?(ratio|mean|proportion)/i },
  { label: 'the sensible acts on sense', pattern: /sensibl\w+\s+act\w*\s+on\s+(the\s+)?sense/i },
  { label: 'proper object of each sense', pattern: /proper\s+object.*each\s+sense|each\s+sense.*proper\s+object/i },
  { label: 'sense perceives contraries', pattern: /sense\s+perceiv\w*\s+contrar/i },
];

// TIER 3: Broader perception theory context (score: 2 each)
const TIER3_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'faculty of sensation', pattern: /faculty\s+of\s+sens(ation|e)/i },
  { label: 'sensitive faculty/soul', pattern: /sensitiv\w+\s+(faculty|soul|part)/i },
  { label: 'act of sense/sensation', pattern: /act\s+of\s+(the\s+)?(sense|sens\w+)/i },
  { label: 'touch is the foundation', pattern: /touch\s+is.*found|touch.*basis|without\s+touch/i },
  { label: 'colour is the proper object of sight', pattern: /colou?r\s+is.*object.*sight|sight.*object.*colou?r/i },
  { label: 'sound is proper object of hearing', pattern: /sound\s+is.*object.*hearing|hearing.*object.*sound/i },
  { label: 'organ of sense', pattern: /organ\s+of\s+(the\s+)?sense/i },
  { label: 'imagination/phantasm', pattern: /\bphantasm\b|imagination\s+(is|arises|comes|depends)/i },
  { label: 'sense receives form without matter', pattern: /sense\s+receiv\w*\s+(the\s+)?form\s+without\s+(the\s+)?matter/i },
  { label: 'mean between contraries', pattern: /mean\s+between\s+(the\s+)?contrar/i },
];

async function main() {
  console.log('Fetching all Aristotle chunks from ChromaDB...');
  const { ids, documents, metadatas } = await fetchAllAristotleChunks();
  console.log(`Total Aristotle chunks: ${ids.length}\n`);

  const results: ChunkResult[] = [];

  for (let i = 0; i < ids.length; i++) {
    const content = documents[i] || '';
    const meta = metadatas[i] || {};
    const matchedTerms: string[] = [];
    let score = 0;
    let highestTier: 1 | 2 | 3 = 3;

    for (const { label, pattern } of TIER1_PATTERNS) {
      if (pattern.test(content)) {
        matchedTerms.push(`[T1] ${label}`);
        score += 10;
        highestTier = 1;
      }
    }

    for (const { label, pattern } of TIER2_PATTERNS) {
      if (pattern.test(content)) {
        matchedTerms.push(`[T2] ${label}`);
        score += 5;
        if (highestTier > 2) highestTier = 2;
      }
    }

    for (const { label, pattern } of TIER3_PATTERNS) {
      if (pattern.test(content)) {
        matchedTerms.push(`[T3] ${label}`);
        score += 2;
      }
    }

    if (matchedTerms.length > 0 && score >= 5) {
      results.push({
        id: ids[i],
        content,
        metadata: meta,
        matchedTerms,
        tier: highestTier,
        score,
      });
    }
  }

  // Deduplicate by content (My Copy vs clean copy)
  const deduped = new Map<string, ChunkResult>();
  for (const r of results) {
    const contentKey = r.content.substring(0, 300);
    const existing = deduped.get(contentKey);
    if (!existing || r.score > existing.score) {
      deduped.set(contentKey, r);
    }
  }

  const dedupedResults = [...deduped.values()];
  dedupedResults.sort((a, b) => {
    // Sort by tier (1 first), then by score (highest first)
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.score - a.score;
  });

  console.log(`Found ${results.length} raw matches, ${dedupedResults.length} after deduplication\n`);

  // Group by title within each tier
  for (const tier of [1, 2, 3] as const) {
    const tierResults = dedupedResults.filter(r => r.tier === tier);
    if (tierResults.length === 0) continue;

    const tierLabel = tier === 1 ? 'TIER 1 — DIRECT COMMON SENSE DOCTRINE'
      : tier === 2 ? 'TIER 2 — CROSS-MODAL PERCEPTION & DISCRIMINATION'
        : 'TIER 3 — BROADER PERCEPTION THEORY CONTEXT';

    console.log(`\n${'='.repeat(100)}`);
    console.log(`${tierLabel} (${tierResults.length} passages)`);
    console.log('='.repeat(100));

    // Sub-group by title
    const byTitle = new Map<string, ChunkResult[]>();
    for (const r of tierResults) {
      const title = r.metadata.title_raw || '?';
      if (!byTitle.has(title)) byTitle.set(title, []);
      byTitle.get(title)!.push(r);
    }

    // Priority order for titles
    const priorityOrder = [
      'On The Soul (De Anima)',
      'Sense And Sensibilia',
      'On Memory',
      'Movement Of Animals',
      'Metaphysics',
      'Physics',
      'Rhetoric',
      'On Colours',
      'On Things Heard',
    ];

    for (const titleKey of priorityOrder) {
      const chunks = byTitle.get(titleKey);
      if (!chunks || chunks.length === 0) continue;

      chunks.sort((a, b) => (a.metadata.page_start || 0) - (b.metadata.page_start || 0));

      console.log(`\n  --- ${titleKey} (${chunks.length} passages) ---`);

      for (const chunk of chunks) {
        const ps = chunk.metadata.page_start ?? '?';
        const pe = chunk.metadata.page_end ?? '?';
        const pageStr = ps === pe ? `p. ${ps}` : `pp. ${ps}-${pe}`;

        console.log(`\n  [Score: ${chunk.score}] ${titleKey}, ${pageStr}`);
        console.log(`  Chunk ID: ${chunk.id}`);
        console.log(`  Matched: ${chunk.matchedTerms.join(' | ')}`);
        console.log(`  ---`);
        console.log(chunk.content);
        console.log(`  --- END PASSAGE ---`);
      }
    }
  }

  // Final summary
  console.log(`\n${'='.repeat(100)}`);
  console.log('FINAL SUMMARY');
  console.log('='.repeat(100));
  const tier1 = dedupedResults.filter(r => r.tier === 1);
  const tier2 = dedupedResults.filter(r => r.tier === 2);
  const tier3 = dedupedResults.filter(r => r.tier === 3);
  console.log(`Tier 1 (Direct common sense): ${tier1.length} passages`);
  console.log(`Tier 2 (Cross-modal/discrimination): ${tier2.length} passages`);
  console.log(`Tier 3 (Broader perception context): ${tier3.length} passages`);
  console.log(`Total unique passages: ${dedupedResults.length}`);
}

main().catch(console.error);
