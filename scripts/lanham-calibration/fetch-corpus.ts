/**
 * F2: Fetch and build expansion corpus from Project Gutenberg + other public domain sources.
 * Extracts 100-400 word prose passages from full texts.
 *
 * Usage: npx tsx scripts/lanham-calibration/fetch-corpus.ts
 * Output: data/expansion-corpus.jsonl
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface CorpusEntry {
  id: string;
  genre: string;
  text: string;
  source: string;
  period: string;
  word_count: number;
}

interface GutenbergSource {
  url: string;
  author: string;
  title: string;
  genre: string;
  period: string;
  passageCount: number;
}

// Project Gutenberg plain text URLs (UTF-8)
const SOURCES: GutenbergSource[] = [
  // Literary fiction
  { url: 'https://www.gutenberg.org/cache/epub/1342/pg1342.txt', author: 'Jane Austen', title: 'Pride and Prejudice', genre: 'literary-fiction', period: '19th-century', passageCount: 3 },
  { url: 'https://www.gutenberg.org/cache/epub/98/pg98.txt', author: 'Charles Dickens', title: 'A Tale of Two Cities', genre: 'literary-fiction', period: '19th-century', passageCount: 3 },
  { url: 'https://www.gutenberg.org/cache/epub/2701/pg2701.txt', author: 'Herman Melville', title: 'Moby-Dick', genre: 'literary-fiction', period: '19th-century', passageCount: 3 },
  { url: 'https://www.gutenberg.org/cache/epub/76/pg76.txt', author: 'Mark Twain', title: 'Adventures of Huckleberry Finn', genre: 'literary-fiction', period: '19th-century', passageCount: 2 },
  { url: 'https://www.gutenberg.org/cache/epub/1260/pg1260.txt', author: 'Charlotte Brontë', title: 'Jane Eyre', genre: 'literary-fiction', period: '19th-century', passageCount: 3 },
  { url: 'https://www.gutenberg.org/cache/epub/219/pg219.txt', author: 'Thomas Hardy', title: 'Far from the Madding Crowd', genre: 'literary-fiction', period: '19th-century', passageCount: 2 },
  { url: 'https://www.gutenberg.org/cache/epub/526/pg526.txt', author: 'Joseph Conrad', title: 'Heart of Darkness', genre: 'literary-fiction', period: '20th-century', passageCount: 3 },
  { url: 'https://www.gutenberg.org/cache/epub/209/pg209.txt', author: 'Henry James', title: 'The Turn of the Screw', genre: 'literary-fiction', period: '19th-century', passageCount: 2 },
  { url: 'https://www.gutenberg.org/cache/epub/145/pg145.txt', author: 'George Eliot', title: 'Middlemarch', genre: 'literary-fiction', period: '19th-century', passageCount: 3 },
  { url: 'https://www.gutenberg.org/cache/epub/541/pg541.txt', author: 'Edith Wharton', title: 'The Age of Innocence', genre: 'literary-fiction', period: '20th-century', passageCount: 2 },
  { url: 'https://www.gutenberg.org/cache/epub/73/pg73.txt', author: 'Nathaniel Hawthorne', title: 'The Scarlet Letter', genre: 'literary-fiction', period: '19th-century', passageCount: 2 },
  { url: 'https://www.gutenberg.org/cache/epub/2600/pg2600.txt', author: 'Leo Tolstoy', title: 'War and Peace (trans. Garnett)', genre: 'literary-fiction', period: '19th-century', passageCount: 3 },

  // Academic humanities
  { url: 'https://www.gutenberg.org/cache/epub/34901/pg34901.txt', author: 'John Stuart Mill', title: 'On Liberty', genre: 'academic-humanities', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/16643/pg16643.txt', author: 'John Stuart Mill', title: 'Utilitarianism', genre: 'academic-humanities', period: '19th-century', passageCount: 4 },
  { url: 'https://www.gutenberg.org/cache/epub/2130/pg2130.txt', author: 'Ralph Waldo Emerson', title: 'Essays (First Series)', genre: 'academic-humanities', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/205/pg205.txt', author: 'Henry David Thoreau', title: 'Walden', genre: 'academic-humanities', period: '19th-century', passageCount: 4 },
  { url: 'https://www.gutenberg.org/cache/epub/4280/pg4280.txt', author: 'John Henry Newman', title: 'The Idea of a University', genre: 'academic-humanities', period: '19th-century', passageCount: 4 },
  { url: 'https://www.gutenberg.org/cache/epub/4705/pg4705.txt', author: 'Edmund Burke', title: 'Reflections on the Revolution in France', genre: 'academic-humanities', period: '18th-century', passageCount: 4 },
  { url: 'https://www.gutenberg.org/cache/epub/9662/pg9662.txt', author: 'David Hume', title: 'An Enquiry Concerning Human Understanding', genre: 'academic-humanities', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/7370/pg7370.txt', author: 'John Locke', title: 'Second Treatise of Government', genre: 'academic-humanities', period: '17th-century', passageCount: 4 },
  { url: 'https://www.gutenberg.org/cache/epub/3207/pg3207.txt', author: 'Adam Smith', title: 'Wealth of Nations', genre: 'academic-humanities', period: '18th-century', passageCount: 5 },

  // Academic social science
  { url: 'https://www.gutenberg.org/cache/epub/815/pg815.txt', author: 'Alexis de Tocqueville', title: 'Democracy in America (Vol 1)', genre: 'academic-social-science', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/4300/pg4300.txt', author: 'Charles Darwin', title: 'On the Origin of Species', genre: 'academic-sciences', period: '19th-century', passageCount: 6 },
  { url: 'https://www.gutenberg.org/cache/epub/2009/pg2009.txt', author: 'Charles Darwin', title: 'The Descent of Man', genre: 'academic-sciences', period: '19th-century', passageCount: 4 },
  { url: 'https://www.gutenberg.org/cache/epub/833/pg833.txt', author: 'Thorstein Veblen', title: 'The Theory of the Leisure Class', genre: 'academic-social-science', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/10616/pg10616.txt', author: 'William James', title: 'Pragmatism', genre: 'academic-social-science', period: '20th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/852/pg852.txt', author: 'William James', title: 'Varieties of Religious Experience', genre: 'academic-social-science', period: '20th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/852/pg852.txt', author: 'Sigmund Freud', title: 'Interpretation of Dreams (trans.)', genre: 'academic-social-science', period: '20th-century', passageCount: 5 },

  // Academic sciences
  { url: 'https://www.gutenberg.org/cache/epub/14558/pg14558.txt', author: 'Michael Faraday', title: 'The Chemical History of a Candle', genre: 'academic-sciences', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/2472/pg2472.txt', author: 'T.H. Huxley', title: "Man's Place in Nature", genre: 'academic-sciences', period: '19th-century', passageCount: 5 },

  // Legal
  { url: 'https://www.gutenberg.org/cache/epub/30802/pg30802.txt', author: 'William Blackstone', title: 'Commentaries on the Laws of England (Vol 1)', genre: 'legal', period: '18th-century', passageCount: 8 },

  // Political speeches and documents
  { url: 'https://www.gutenberg.org/cache/epub/815/pg815.txt', author: 'Thomas Paine', title: 'Common Sense', genre: 'political-other', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/3743/pg3743.txt', author: 'Thomas Paine', title: 'Rights of Man', genre: 'political-other', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/18/pg18.txt', author: 'Alexander Hamilton et al.', title: 'The Federalist Papers', genre: 'political-other', period: '18th-century', passageCount: 5 },

  // Literary criticism
  { url: 'https://www.gutenberg.org/cache/epub/5765/pg5765.txt', author: 'Samuel Johnson', title: 'Preface to Shakespeare', genre: 'literary-criticism', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/6081/pg6081.txt', author: 'Samuel Taylor Coleridge', title: 'Biographia Literaria', genre: 'literary-criticism', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/5765/pg5765.txt', author: 'William Hazlitt', title: 'The Spirit of the Age', genre: 'literary-criticism', period: '19th-century', passageCount: 5 },

  // Polemical
  { url: 'https://www.gutenberg.org/cache/epub/1080/pg1080.txt', author: 'Jonathan Swift', title: 'A Modest Proposal', genre: 'polemical', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/3420/pg3420.txt', author: 'Mary Wollstonecraft', title: 'Vindication of the Rights of Woman', genre: 'polemical', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/3726/pg3726.txt', author: 'Thomas Carlyle', title: 'On Heroes, Hero-Worship, and the Heroic', genre: 'polemical', period: '19th-century', passageCount: 5 },

  // Religious
  { url: 'https://www.gutenberg.org/cache/epub/10/pg10.txt', author: 'King James Bible', title: 'King James Bible', genre: 'religious', period: '17th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/131/pg131.txt', author: 'John Bunyan', title: "Pilgrim's Progress", genre: 'religious', period: '17th-century', passageCount: 5 },

  // Narrative nonfiction
  { url: 'https://www.gutenberg.org/cache/epub/944/pg944.txt', author: 'Charles Darwin', title: 'The Voyage of the Beagle', genre: 'narrative-nonfiction', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/23/pg23.txt', author: 'Frederick Douglass', title: 'Narrative of the Life', genre: 'narrative-nonfiction', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/1564/pg1564.txt', author: 'Olaudah Equiano', title: 'The Interesting Narrative', genre: 'narrative-nonfiction', period: '18th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/86/pg86.txt', author: 'Mark Twain', title: 'Life on the Mississippi', genre: 'narrative-nonfiction', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/1200/pg1200.txt', author: 'Thomas De Quincey', title: 'Confessions of an English Opium-Eater', genre: 'narrative-nonfiction', period: '19th-century', passageCount: 5 },

  // Personal correspondence
  { url: 'https://www.gutenberg.org/cache/epub/1159/pg1159.txt', author: 'Lord Byron', title: 'Letters of Lord Byron', genre: 'personal-correspondence', period: '19th-century', passageCount: 5 },
  { url: 'https://www.gutenberg.org/cache/epub/35411/pg35411.txt', author: 'John Keats', title: 'Letters of John Keats', genre: 'personal-correspondence', period: '19th-century', passageCount: 5 },

  // Military
  { url: 'https://www.gutenberg.org/cache/epub/4363/pg4363.txt', author: 'Ulysses S. Grant', title: 'Personal Memoirs', genre: 'military', period: '19th-century', passageCount: 5 },
];

/**
 * Extract prose passages from a Gutenberg text.
 * Skips headers, footers, chapter titles, dialogue-heavy sections.
 */
function extractPassages(text: string, count: number, minWords: number = 120, maxWords: number = 380): string[] {
  // Strip Gutenberg header/footer
  const startMatch = text.match(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG/i);
  const endMatch = text.match(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
  let body = text;
  if (startMatch) body = body.slice(startMatch.index! + startMatch[0].length);
  if (endMatch) body = body.slice(0, endMatch.index);

  // Split into paragraphs
  const paragraphs = body.split(/\n\s*\n/)
    .map(p => p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => {
      const words = p.split(/\s+/).length;
      // Filter: must be prose (not headers, not too short, not all caps)
      if (words < 30) return false;
      if (p === p.toUpperCase()) return false;
      if (/^(CHAPTER|BOOK|PART|SECTION|VOLUME)\s/i.test(p)) return false;
      // Skip dialogue-heavy paragraphs (>50% in quotes)
      const quoteChars = (p.match(/[""'"']/g) || []).length;
      if (quoteChars > p.length * 0.05) return false;
      return true;
    });

  if (paragraphs.length === 0) return [];

  // Select evenly-spaced paragraphs to get variety
  const step = Math.max(1, Math.floor(paragraphs.length / (count * 3)));
  const candidates: string[] = [];

  for (let i = 0; i < paragraphs.length && candidates.length < count * 3; i += step) {
    const p = paragraphs[i];
    const words = p.split(/\s+/);

    if (words.length >= minWords && words.length <= maxWords) {
      candidates.push(p);
    } else if (words.length > maxWords) {
      // Truncate to ~300 words at sentence boundary
      const truncated = truncateAtSentence(p, maxWords);
      if (truncated.split(/\s+/).length >= minWords) {
        candidates.push(truncated);
      }
    } else if (words.length >= 60 && i + step < paragraphs.length) {
      // Try merging with next paragraph
      const next = paragraphs[Math.min(i + 1, paragraphs.length - 1)];
      const merged = p + ' ' + next;
      const mergedWords = merged.split(/\s+/).length;
      if (mergedWords >= minWords && mergedWords <= maxWords) {
        candidates.push(merged);
      }
    }
  }

  return candidates.slice(0, count);
}

function truncateAtSentence(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;

  const truncated = words.slice(0, maxWords).join(' ');
  // Find last sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExcl = truncated.lastIndexOf('!');
  const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExcl);

  if (lastBoundary > truncated.length * 0.5) {
    return truncated.slice(0, lastBoundary + 1);
  }
  return truncated;
}

async function fetchText(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (err: any) {
    console.error(`  Failed to fetch ${url}: ${err.message}`);
    return '';
  }
}

async function main() {
  const outputPath = resolve(process.cwd(), 'data/expansion-corpus.jsonl');
  const goldPath = resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl');

  // Load gold set IDs for deduplication
  const goldTexts = new Set<string>();
  if (existsSync(goldPath)) {
    const goldEntries = readFileSync(goldPath, 'utf-8').split('\n').filter(l => l.trim());
    for (const line of goldEntries) {
      const entry = JSON.parse(line);
      // Store first 50 words as fingerprint
      goldTexts.add(entry.text.split(/\s+/).slice(0, 50).join(' ').toLowerCase());
    }
  }

  const entries: CorpusEntry[] = [];
  let idCounter = 1;

  console.log('=== F2: Building Expansion Corpus ===');
  console.log(`Sources: ${SOURCES.length} texts`);
  console.log('');

  for (const source of SOURCES) {
    console.log(`Fetching: ${source.author} — ${source.title}...`);
    const text = await fetchText(source.url);

    if (!text || text.length < 1000) {
      console.log(`  SKIP: too short or fetch failed`);
      continue;
    }

    const passages = extractPassages(text, source.passageCount);
    console.log(`  Extracted ${passages.length} passages`);

    for (const passage of passages) {
      // Deduplication check against gold set
      const fingerprint = passage.split(/\s+/).slice(0, 50).join(' ').toLowerCase();
      if (goldTexts.has(fingerprint)) {
        console.log(`  SKIP: overlaps with gold set`);
        continue;
      }

      const wordCount = passage.split(/\s+/).length;
      entries.push({
        id: `expansion_${String(idCounter++).padStart(3, '0')}`,
        genre: source.genre,
        text: passage,
        source: `${source.author}, ${source.title}`,
        period: source.period,
        word_count: wordCount,
      });
    }

    // Small delay between fetches
    await new Promise(r => setTimeout(r, 300));
  }

  // Write JSONL
  const jsonl = entries.map(e => JSON.stringify(e)).join('\n');
  writeFileSync(outputPath, jsonl + '\n');

  // Genre distribution summary
  const genreCounts: Record<string, number> = {};
  for (const e of entries) {
    genreCounts[e.genre] = (genreCounts[e.genre] || 0) + 1;
  }

  console.log('');
  console.log('=== Genre Distribution ===');
  for (const [genre, count] of Object.entries(genreCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${genre.padEnd(30)} ${count}`);
  }
  console.log(`  ${'TOTAL'.padEnd(30)} ${entries.length}`);
  console.log('');
  console.log(`Output: ${outputPath}`);

  // Word count stats
  const wordCounts = entries.map(e => e.word_count);
  const avgWords = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const minWords = Math.min(...wordCounts);
  const maxWords = Math.max(...wordCounts);
  console.log(`Words: avg=${avgWords.toFixed(0)}, min=${minWords}, max=${maxWords}`);
}

main().catch(e => { console.error(e); process.exit(1); });
