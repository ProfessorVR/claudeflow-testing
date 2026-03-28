/**
 * OpenAccessSearcher - Search academic repositories for open access versions
 *
 * This module searches various academic repositories for open access versions
 * of scholarly sources:
 * - Semantic Scholar
 * - arXiv
 * - PhilPapers / PhilArchive
 * - Internet Archive
 * - Project Gutenberg (for classics)
 *
 * IMPORTANT: This module respects copyright and only finds legitimately
 * open access versions. It does NOT bypass paywalls.
 */

import * as https from 'https';
import { URL } from 'url';

// ============================================================================
// Types
// ============================================================================

/**
 * Open access search result
 */
export interface OpenAccessResult {
  /** Source that was searched for */
  query: {
    author: string;
    title?: string;
    year?: number;
  };
  /** Whether an open access version was found */
  found: boolean;
  /** Confidence in the match (0-1) */
  confidence: number;
  /** Direct PDF URL if available */
  pdfUrl?: string;
  /** Landing page URL */
  landingUrl?: string;
  /** Repository source */
  repository?: string;
  /** License information */
  license?: string;
  /** DOI if available */
  doi?: string;
  /** Error message if search failed */
  error?: string;
}

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Enable Semantic Scholar search */
  searchSemanticScholar: boolean;
  /** Enable arXiv search */
  searchArxiv: boolean;
  /** Enable PhilPapers search */
  searchPhilPapers: boolean;
  /** Enable Internet Archive search */
  searchInternetArchive: boolean;
  /** Enable Project Gutenberg search (for classics) */
  searchGutenberg: boolean;
  /** Request timeout (ms) */
  timeout: number;
  /** Verbose logging */
  verbose: boolean;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: SearchConfig = {
  searchSemanticScholar: true,
  searchArxiv: true,
  searchPhilPapers: true,
  searchInternetArchive: true,
  searchGutenberg: true,
  timeout: 10000,
  verbose: false,
};

// ============================================================================
// Known Open Access Sources (for quick lookup)
// ============================================================================

/**
 * Pre-indexed open access sources for common philosophical texts
 */
const KNOWN_OPEN_ACCESS: Record<string, { pdfUrl?: string; landingUrl: string; repository: string }> = {
  // Aristotle's works
  'aristotle_nicomachean_ethics': {
    landingUrl: 'https://www.gutenberg.org/ebooks/8438',
    repository: 'Project Gutenberg',
  },
  'aristotle_de_anima': {
    landingUrl: 'http://classics.mit.edu/Aristotle/soul.html',
    repository: 'MIT Classics',
  },
  'aristotle_rhetoric': {
    landingUrl: 'http://classics.mit.edu/Aristotle/rhetoric.html',
    repository: 'MIT Classics',
  },
  'aristotle_poetics': {
    landingUrl: 'http://classics.mit.edu/Aristotle/poetics.html',
    repository: 'MIT Classics',
  },
  'aristotle_physics': {
    landingUrl: 'http://classics.mit.edu/Aristotle/physics.html',
    repository: 'MIT Classics',
  },
  'aristotle_metaphysics': {
    landingUrl: 'http://classics.mit.edu/Aristotle/metaphysics.html',
    repository: 'MIT Classics',
  },

  // Plato's works
  'plato_republic': {
    landingUrl: 'https://www.gutenberg.org/ebooks/1497',
    repository: 'Project Gutenberg',
  },
  'plato_phaedrus': {
    landingUrl: 'http://classics.mit.edu/Plato/phaedrus.html',
    repository: 'MIT Classics',
  },
  'plato_symposium': {
    landingUrl: 'http://classics.mit.edu/Plato/symposium.html',
    repository: 'MIT Classics',
  },
  'plato_theaetetus': {
    landingUrl: 'http://classics.mit.edu/Plato/theatu.html',
    repository: 'MIT Classics',
  },

  // Modern philosophy (public domain)
  'descartes_meditations': {
    landingUrl: 'https://www.gutenberg.org/ebooks/59',
    repository: 'Project Gutenberg',
  },
  'kant_critique_pure_reason': {
    landingUrl: 'https://www.gutenberg.org/ebooks/4280',
    repository: 'Project Gutenberg',
  },
  'hume_enquiry_understanding': {
    landingUrl: 'https://www.gutenberg.org/ebooks/9662',
    repository: 'Project Gutenberg',
  },

  // Open access articles (from Philosopher's Annual, etc.)
  'moss_akrasia_perceptual_2009': {
    pdfUrl: 'https://pgrim.org/philosophersannual/29articles/mossakrasia.pdf',
    landingUrl: 'https://philpapers.org/rec/MOSAAP',
    repository: "Philosopher's Annual",
  },
};

// ============================================================================
// OpenAccessSearcher Class
// ============================================================================

/**
 * Searches academic repositories for open access versions of sources
 */
export class OpenAccessSearcher {
  private config: SearchConfig;

  constructor(config: Partial<SearchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Search for open access version of a source
   */
  async searchOpenAccess(
    author: string,
    title?: string,
    year?: number
  ): Promise<OpenAccessResult> {
    const query = { author, title, year };

    // First check known sources
    const knownResult = this.checkKnownSources(author, title);
    if (knownResult) {
      return {
        query,
        found: true,
        confidence: 1.0,
        ...knownResult,
      };
    }

    // Search repositories in parallel
    const results = await Promise.allSettled([
      this.config.searchSemanticScholar ? this.searchSemanticScholar(author, title, year) : null,
      this.config.searchPhilPapers ? this.searchPhilPapers(author, title) : null,
      this.config.searchInternetArchive ? this.searchInternetArchive(author, title) : null,
    ]);

    // Find best result
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value?.found) {
        return {
          query,
          found: result.value.found,
          confidence: result.value.confidence || 0,
          pdfUrl: result.value.pdfUrl,
          landingUrl: result.value.landingUrl,
          repository: result.value.repository,
          license: result.value.license,
          doi: result.value.doi,
        };
      }
    }

    // No results found
    return {
      query,
      found: false,
      confidence: 0,
    };
  }

  /**
   * Check known open access sources
   */
  private checkKnownSources(author: string, title?: string): Partial<OpenAccessResult> | null {
    const authorLower = author.toLowerCase();
    const titleLower = title?.toLowerCase() || '';

    for (const [key, source] of Object.entries(KNOWN_OPEN_ACCESS)) {
      const parts = key.split('_');
      const keyAuthor = parts[0];
      const keyTitle = parts.slice(1).join('_');

      // Check author match
      if (authorLower.includes(keyAuthor) || keyAuthor.includes(authorLower.split(' ')[0].toLowerCase())) {
        // If title provided, check title match
        if (title) {
          const keyTitleWords = keyTitle.split('_');
          const titleWords = titleLower.split(/\s+/);
          const matchCount = keyTitleWords.filter(w => titleWords.some(tw => tw.includes(w))).length;

          if (matchCount >= 2 || matchCount >= keyTitleWords.length * 0.5) {
            return {
              found: true,
              confidence: 0.95,
              pdfUrl: source.pdfUrl,
              landingUrl: source.landingUrl,
              repository: source.repository,
            };
          }
        } else if (parts.length === 1) {
          // Author-only match for general works
          return {
            found: true,
            confidence: 0.7,
            landingUrl: source.landingUrl,
            repository: source.repository,
          };
        }
      }
    }

    return null;
  }

  /**
   * Search Semantic Scholar API
   */
  private async searchSemanticScholar(
    author: string,
    title?: string,
    year?: number
  ): Promise<Partial<OpenAccessResult>> {
    const query = [author, title, year].filter(Boolean).join(' ');
    const encodedQuery = encodeURIComponent(query);

    try {
      const response = await this.httpGet(
        `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodedQuery}&fields=title,authors,year,openAccessPdf,url&limit=5`
      );

      const data = JSON.parse(response);

      if (data.data && data.data.length > 0) {
        // Find best match
        for (const paper of data.data) {
          // Check author match
          const paperAuthors = (paper.authors || []).map((a: { name: string }) => a.name.toLowerCase()).join(' ');
          const authorLower = author.toLowerCase();

          if (paperAuthors.includes(authorLower.split(' ')[0]) || paperAuthors.includes(authorLower.split(',')[0])) {
            // Check title match if provided
            if (title) {
              const paperTitle = (paper.title || '').toLowerCase();
              const titleLower = title.toLowerCase();
              const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3);
              const matchCount = titleWords.filter(w => paperTitle.includes(w)).length;

              if (matchCount < 2 && matchCount < titleWords.length * 0.4) {
                continue;
              }
            }

            if (paper.openAccessPdf?.url) {
              return {
                found: true,
                confidence: 0.85,
                pdfUrl: paper.openAccessPdf.url,
                landingUrl: paper.url,
                repository: 'Semantic Scholar',
                doi: paper.paperId,
              };
            }
          }
        }
      }
    } catch (error) {
      if (this.config.verbose) {
        console.warn('Semantic Scholar search failed:', error);
      }
    }

    return { found: false, confidence: 0 };
  }

  /**
   * Search PhilPapers (simplified - just check known URLs)
   */
  private async searchPhilPapers(
    author: string,
    title?: string
  ): Promise<Partial<OpenAccessResult>> {
    // PhilPapers doesn't have a public API, so we construct likely URLs
    // This is a simplified implementation

    const authorLower = author.toLowerCase().replace(/[^a-z]/g, '');
    const titleWords = title?.toLowerCase().split(/\s+/).filter(w => w.length > 3) || [];

    // Generate possible PhilPapers record IDs
    const possibleIds = titleWords.slice(0, 3).map(w => w.substring(0, 3).toUpperCase()).join('');

    if (possibleIds) {
      const url = `https://philpapers.org/rec/${authorLower.substring(0, 3).toUpperCase()}${possibleIds}`;

      return {
        found: false,
        confidence: 0,
        landingUrl: url,
        repository: 'PhilPapers (potential)',
      };
    }

    return { found: false, confidence: 0 };
  }

  /**
   * Search Internet Archive
   */
  private async searchInternetArchive(
    author: string,
    title?: string
  ): Promise<Partial<OpenAccessResult>> {
    const query = [author, title].filter(Boolean).join(' ');
    const encodedQuery = encodeURIComponent(query);

    try {
      const response = await this.httpGet(
        `https://archive.org/advancedsearch.php?q=${encodedQuery}&fl[]=identifier,title,creator&rows=5&output=json`
      );

      const data = JSON.parse(response);

      if (data.response?.docs?.length > 0) {
        for (const doc of data.response.docs) {
          const docCreator = (doc.creator || '').toLowerCase();
          const authorLower = author.toLowerCase();

          if (docCreator.includes(authorLower.split(' ')[0]) || docCreator.includes(authorLower.split(',')[0])) {
            return {
              found: true,
              confidence: 0.75,
              landingUrl: `https://archive.org/details/${doc.identifier}`,
              repository: 'Internet Archive',
            };
          }
        }
      }
    } catch (error) {
      if (this.config.verbose) {
        console.warn('Internet Archive search failed:', error);
      }
    }

    return { found: false, confidence: 0 };
  }

  /**
   * HTTP GET helper
   */
  private static readonly ALLOWED_HOSTS = new Set([
    'api.semanticscholar.org',
    'archive.org',
    'philpapers.org',
  ]);

  private httpGet(url: string, maxBytes: number = 512 * 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);

      if (!OpenAccessSearcher.ALLOWED_HOSTS.has(parsedUrl.hostname)) {
        reject(new Error(`Host not allowed: ${parsedUrl.hostname}`));
        return;
      }

      const request = https.get(url, {
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AcademicOpenAccessSearcher/1.0)',
        },
      }, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        let data = '';
        let receivedBytes = 0;
        response.on('data', (chunk: Buffer | string) => {
          receivedBytes += typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length;
          if (receivedBytes > maxBytes) {
            request.destroy();
            reject(new Error(`Response exceeded ${maxBytes} bytes`));
            return;
          }
          data += chunk;
        });
        response.on('end', () => resolve(data));
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  /**
   * Search multiple sources in parallel
   */
  async searchMultiple(
    sources: Array<{ author: string; title?: string; year?: number }>
  ): Promise<OpenAccessResult[]> {
    const results = await Promise.all(
      sources.map(s => this.searchOpenAccess(s.author, s.title, s.year))
    );
    return results;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create an open access searcher with default settings
 */
export function createOpenAccessSearcher(config?: Partial<SearchConfig>): OpenAccessSearcher {
  return new OpenAccessSearcher(config);
}

/**
 * Singleton instance
 */
let _instance: OpenAccessSearcher | null = null;

export function getOpenAccessSearcher(): OpenAccessSearcher {
  if (!_instance) {
    _instance = new OpenAccessSearcher();
  }
  return _instance;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Open Access Searcher

Usage:
  npx tsx open-access-searcher.ts --author <name> [--title <title>] [--year <year>]

Options:
  --author <name>    Author name (required)
  --title <title>    Title of work
  --year <year>      Publication year
  --json             Output as JSON
  --verbose          Verbose logging
  --help, -h         Show this help
`);
    process.exit(0);
  }

  const authorIndex = args.indexOf('--author');
  const titleIndex = args.indexOf('--title');
  const yearIndex = args.indexOf('--year');
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');

  if (authorIndex === -1 || !args[authorIndex + 1]) {
    console.error('Error: --author required');
    process.exit(1);
  }

  const author = args[authorIndex + 1];
  const title = titleIndex !== -1 ? args[titleIndex + 1] : undefined;
  const year = yearIndex !== -1 ? parseInt(args[yearIndex + 1], 10) : undefined;

  const searcher = new OpenAccessSearcher({ verbose });
  const result = await searcher.searchOpenAccess(author, title, year);

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('\n=== Open Access Search Results ===\n');
    console.log(`Query: ${author}${title ? ` - ${title}` : ''}${year ? ` (${year})` : ''}`);
    console.log(`Found: ${result.found ? 'Yes' : 'No'}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);

    if (result.found) {
      if (result.pdfUrl) {
        console.log(`PDF URL: ${result.pdfUrl}`);
      }
      if (result.landingUrl) {
        console.log(`Landing Page: ${result.landingUrl}`);
      }
      if (result.repository) {
        console.log(`Repository: ${result.repository}`);
      }
    }
    console.log('');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
