/**
 * CitationLookupTool - LLM Tool for Inline Citation Retrieval
 *
 * Provides a tool-use interface that allows the LLM to query the corpus
 * for valid citations BEFORE making claims. This prevents hallucinations
 * by ensuring the LLM has access to actual corpus content at generation time.
 *
 * Part of the Inline Citation Enforcement Architecture (Phase 1).
 */

import type { Tool, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages.js';
import type { ContextChunk } from './corpus-constraint-builder.js';
import type { CorpusSource } from './writing-generator.js';

/**
 * Request to look up citations from corpus
 */
export interface CitationLookupRequest {
  /** Natural language description of needed evidence */
  query: string;
  /** Type of claim being made */
  claimType: 'factual' | 'interpretive' | 'methodological' | 'theoretical' | 'synthesis';
  /** Optional: prefer citations from these authors */
  preferredAuthors?: string[];
  /** Maximum results to return (default: 5) */
  maxResults?: number;
  /** Minimum relevance score (default: 0.65) */
  minRelevance?: number;
}

/**
 * A citation that has been verified to exist in corpus
 */
export interface ValidCorpusCitation {
  /** Author name(s) */
  author: string;
  /** Publication year */
  year: number | null;
  /** Work title */
  title: string;
  /** Citation key for reference (e.g., "Aristotle_DeAnima") */
  citationKey: string;
  /** Relevant chunks from this source */
  relevantChunks: ContextChunk[];
  /** Page range string (e.g., "pp. 219-225") */
  pageRanges: string;
  /** Relevance score to query */
  relevanceScore: number;
  /** Document ID for tracing */
  docId?: string;
}

/**
 * A quote extracted from corpus
 */
export interface CorpusQuote {
  /** Exact quote text from corpus */
  text: string;
  /** Source citation */
  source: ValidCorpusCitation;
  /** Page number if available */
  page?: number;
  /** Surrounding context for understanding */
  context: string;
  /** Relevance to query */
  relevanceScore: number;
}

/**
 * Result of citation lookup
 */
export interface CitationLookupResult {
  /** Valid citations found in corpus */
  citations: ValidCorpusCitation[];
  /** Relevant quotes that can be used */
  relevantQuotes: CorpusQuote[];
  /** Suggested framings based on available evidence */
  suggestedFramings: string[];
  /** Total chunks searched */
  chunksSearched: number;
  /** Query that was executed */
  query: string;
  /** Whether sufficient evidence was found */
  hasAdequateEvidence: boolean;
}

/**
 * Retrieval function type (allows injection of different retrievers)
 */
export type CorpusRetriever = (
  query: string,
  options: { maxChunks: number; minRelevance: number; collections?: string[] }
) => Promise<ContextChunk[]>;

/**
 * CitationLookupTool
 *
 * Tool-use interface that allows the LLM to query the corpus
 * for valid citations BEFORE generating claims.
 */
export class CitationLookupTool {
  private retriever: CorpusRetriever;
  private corpusSources: Map<string, CorpusSource>;
  private chunksByAuthor: Map<string, ContextChunk[]>;
  private preloadedChunks: ContextChunk[];

  constructor(
    retriever: CorpusRetriever,
    corpusSources: CorpusSource[] = [],
    preloadedChunks: ContextChunk[] = []
  ) {
    this.retriever = retriever;
    this.corpusSources = new Map(
      corpusSources.map(s => [this.normalizeAuthor(s.author), s])
    );
    this.preloadedChunks = preloadedChunks;
    this.chunksByAuthor = this.indexChunksByAuthor(preloadedChunks);
  }

  /**
   * Get tool definition for Anthropic tool-use API
   */
  static getToolDefinition(): Tool {
    return {
      name: 'citation_lookup',
      description:
        'Look up valid citations from the scholarly corpus before making claims. ' +
        'Use this tool to find evidence and quotations that support your arguments. ' +
        'IMPORTANT: You must use this tool before citing any author to verify the citation exists.',
      input_schema: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string',
            description: 'Natural language description of what evidence you need (e.g., "Aristotle on phantasia and memory")'
          },
          claim_type: {
            type: 'string',
            enum: ['factual', 'interpretive', 'methodological', 'theoretical', 'synthesis'],
            description: 'Type of claim you are making'
          },
          preferred_authors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional: prefer citations from these authors'
          },
          max_results: {
            type: 'integer',
            description: 'Maximum number of citations to return (default: 5)'
          }
        },
        required: ['query']
      }
    };
  }

  /**
   * Parse tool use block from LLM response
   */
  static parseToolUse(toolUse: ToolUseBlock): CitationLookupRequest {
    const input = toolUse.input as Record<string, unknown>;
    return {
      query: input.query as string,
      claimType: (input.claim_type as CitationLookupRequest['claimType']) || 'factual',
      preferredAuthors: input.preferred_authors as string[] | undefined,
      maxResults: input.max_results as number | undefined,
    };
  }

  /**
   * Execute citation lookup
   */
  async lookup(request: CitationLookupRequest): Promise<CitationLookupResult> {
    const maxResults = request.maxResults ?? 5;
    const minRelevance = request.minRelevance ?? 0.65;

    // Step 1: Search for relevant chunks
    let chunks: ContextChunk[];

    if (this.preloadedChunks.length > 0) {
      // Use preloaded chunks (faster, already filtered for topic)
      chunks = this.searchPreloadedChunks(request.query, maxResults * 3);
    } else {
      // Dynamic retrieval
      chunks = await this.retriever(request.query, {
        maxChunks: maxResults * 3, // Get more than needed for filtering
        minRelevance,
      });
    }

    // Step 2: Apply preferred author boost
    if (request.preferredAuthors && request.preferredAuthors.length > 0) {
      chunks = this.boostPreferredAuthors(chunks, request.preferredAuthors);
    }

    // Step 3: Build valid citations from chunks
    const citations = this.buildCitationsFromChunks(chunks, maxResults);

    // Step 4: Extract usable quotes
    const quotes = this.extractQuotes(chunks, request.query, maxResults);

    // Step 5: Generate suggested framings
    const framings = this.suggestClaimFramings(citations, request.claimType);

    // Step 6: Assess evidence adequacy
    const hasAdequateEvidence = citations.length >= 2 ||
      (citations.length >= 1 && quotes.length >= 1);

    return {
      citations,
      relevantQuotes: quotes,
      suggestedFramings: framings,
      chunksSearched: chunks.length,
      query: request.query,
      hasAdequateEvidence,
    };
  }

  /**
   * Check if an author exists in the corpus
   */
  hasAuthor(author: string): boolean {
    return this.corpusSources.has(this.normalizeAuthor(author)) ||
           this.chunksByAuthor.has(this.normalizeAuthor(author));
  }

  /**
   * Get all available authors in corpus
   */
  getAvailableAuthors(): string[] {
    const authors = new Set<string>();
    for (const source of this.corpusSources.values()) {
      authors.add(source.author);
    }
    for (const author of this.chunksByAuthor.keys()) {
      authors.add(author);
    }
    return Array.from(authors);
  }

  /**
   * Get chunks for a specific author
   */
  getAuthorChunks(author: string): ContextChunk[] {
    return this.chunksByAuthor.get(this.normalizeAuthor(author)) || [];
  }

  /**
   * Format lookup result for LLM consumption
   */
  formatForLLM(result: CitationLookupResult): string {
    const lines: string[] = [];

    lines.push(`## Citation Lookup Results for: "${result.query}"`);
    lines.push('');

    if (!result.hasAdequateEvidence) {
      lines.push('**WARNING**: Limited evidence found in corpus for this claim.');
      lines.push('Consider rephrasing or using different sources.');
      lines.push('');
    }

    if (result.citations.length > 0) {
      lines.push('### Available Citations');
      lines.push('');
      for (const citation of result.citations) {
        const yearStr = citation.year ? `(${citation.year})` : '';
        lines.push(`- **${citation.author}** ${yearStr}`);
        lines.push(`  - Title: ${citation.title}`);
        if (citation.pageRanges) {
          lines.push(`  - Pages: ${citation.pageRanges}`);
        }
        lines.push(`  - Relevance: ${(citation.relevanceScore * 100).toFixed(0)}%`);
        lines.push('');
      }
    }

    if (result.relevantQuotes.length > 0) {
      lines.push('### Usable Quotations');
      lines.push('');
      for (const quote of result.relevantQuotes) {
        lines.push(`> "${quote.text}"`);
        const yearStr = quote.source.year ? `, ${quote.source.year}` : '';
        const pageStr = quote.page ? `, p. ${quote.page}` : '';
        lines.push(`> — ${quote.source.author}${yearStr}${pageStr}`);
        lines.push('');
      }
    }

    if (result.suggestedFramings.length > 0) {
      lines.push('### Suggested Claim Framings');
      lines.push('');
      for (const framing of result.suggestedFramings) {
        lines.push(`- ${framing}`);
      }
    }

    return lines.join('\n');
  }

  // Private helper methods

  private indexChunksByAuthor(chunks: ContextChunk[]): Map<string, ContextChunk[]> {
    const index = new Map<string, ContextChunk[]>();
    for (const chunk of chunks) {
      const author = chunk.metadata.author;
      if (author) {
        const normalized = this.normalizeAuthor(author);
        if (!index.has(normalized)) {
          index.set(normalized, []);
        }
        index.get(normalized)!.push(chunk);
      }
    }
    return index;
  }

  private normalizeAuthor(author: string): string {
    return author.toLowerCase().trim().replace(/,.*$/, '');
  }

  private searchPreloadedChunks(query: string, limit: number): ContextChunk[] {
    // Simple keyword-based search over preloaded chunks
    // In production, this would use semantic similarity
    const queryTerms = query.toLowerCase().split(/\s+/);

    const scored = this.preloadedChunks.map(chunk => {
      const content = chunk.content.toLowerCase();
      let score = chunk.relevanceScore || 0.5;

      // Boost for query term matches
      for (const term of queryTerms) {
        if (term.length > 3 && content.includes(term)) {
          score += 0.1;
        }
      }

      return { chunk, score: Math.min(score, 1.0) };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => ({ ...s.chunk, relevanceScore: s.score }));
  }

  private boostPreferredAuthors(
    chunks: ContextChunk[],
    preferredAuthors: string[]
  ): ContextChunk[] {
    const normalizedPreferred = preferredAuthors.map(a => this.normalizeAuthor(a));

    return chunks.map(chunk => {
      const author = chunk.metadata.author;
      if (author && normalizedPreferred.includes(this.normalizeAuthor(author))) {
        return {
          ...chunk,
          relevanceScore: Math.min(chunk.relevanceScore + 0.15, 1.0)
        };
      }
      return chunk;
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private buildCitationsFromChunks(
    chunks: ContextChunk[],
    limit: number
  ): ValidCorpusCitation[] {
    // Group chunks by author+year+title
    const sourceMap = new Map<string, {
      author: string;
      year: number | null;
      title: string;
      docId?: string;
      chunks: ContextChunk[];
      pages: Set<number>;
      maxRelevance: number;
    }>();

    for (const chunk of chunks) {
      const { author, year, title, page_start, docId } = chunk.metadata;
      if (!author) continue;

      const key = `${author}_${year || 'nd'}_${title || 'unknown'}`;

      if (!sourceMap.has(key)) {
        sourceMap.set(key, {
          author,
          year: year ?? null,
          title: title || 'Unknown Title',
          docId,
          chunks: [],
          pages: new Set(),
          maxRelevance: 0,
        });
      }

      const source = sourceMap.get(key)!;
      source.chunks.push(chunk);
      if (page_start) source.pages.add(page_start);
      source.maxRelevance = Math.max(source.maxRelevance, chunk.relevanceScore);
    }

    // Convert to ValidCorpusCitation array
    const citations: ValidCorpusCitation[] = Array.from(sourceMap.values())
      .map(source => ({
        author: source.author,
        year: source.year,
        title: source.title,
        citationKey: this.generateCitationKey(source.author, source.year),
        relevantChunks: source.chunks,
        pageRanges: this.formatPageRanges(Array.from(source.pages)),
        relevanceScore: source.maxRelevance,
        docId: source.docId,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);

    return citations;
  }

  private extractQuotes(
    chunks: ContextChunk[],
    query: string,
    limit: number
  ): CorpusQuote[] {
    const quotes: CorpusQuote[] = [];
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);

    for (const chunk of chunks) {
      const { author, year, title, page_start } = chunk.metadata;
      if (!author) continue;

      // Extract sentences that contain query terms
      const sentences = chunk.content.split(/[.!?]+/).filter(s => s.trim().length > 20);

      for (const sentence of sentences) {
        const lowerSentence = sentence.toLowerCase();
        const matchCount = queryTerms.filter(t => lowerSentence.includes(t)).length;

        if (matchCount >= Math.min(2, queryTerms.length)) {
          quotes.push({
            text: sentence.trim(),
            source: {
              author,
              year: year ?? null,
              title: title || 'Unknown',
              citationKey: this.generateCitationKey(author, year),
              relevantChunks: [chunk],
              pageRanges: page_start ? `p. ${page_start}` : '',
              relevanceScore: chunk.relevanceScore,
            },
            page: page_start,
            context: chunk.content.slice(0, 200),
            relevanceScore: chunk.relevanceScore * (matchCount / queryTerms.length),
          });
        }
      }
    }

    return quotes
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  private suggestClaimFramings(
    citations: ValidCorpusCitation[],
    claimType: CitationLookupRequest['claimType']
  ): string[] {
    const framings: string[] = [];

    if (citations.length === 0) {
      return ['Consider finding alternative sources or rephrasing your claim.'];
    }

    const mainAuthors = citations.slice(0, 3).map(c => c.author);

    switch (claimType) {
      case 'factual':
        for (const author of mainAuthors) {
          framings.push(`As ${author} observes, ...`);
          framings.push(`${author} notes that ...`);
        }
        break;
      case 'interpretive':
        for (const author of mainAuthors) {
          framings.push(`${author} argues that ...`);
          framings.push(`According to ${author}'s analysis, ...`);
        }
        break;
      case 'theoretical':
        for (const author of mainAuthors) {
          framings.push(`${author}'s framework suggests that ...`);
          framings.push(`Building on ${author}'s account, ...`);
        }
        break;
      case 'methodological':
        for (const author of mainAuthors) {
          framings.push(`Following ${author}'s method, ...`);
          framings.push(`${author} demonstrates that ...`);
        }
        break;
      case 'synthesis':
        if (mainAuthors.length >= 2) {
          framings.push(`Both ${mainAuthors[0]} and ${mainAuthors[1]} recognize that ...`);
          framings.push(`While ${mainAuthors[0]} emphasizes..., ${mainAuthors[1]} argues that ...`);
        }
        break;
    }

    return framings.slice(0, 5);
  }

  private generateCitationKey(author: string, year: number | null | undefined): string {
    const authorPart = author.split(/[,\s]+/)[0];
    const yearPart = year ? `_${year}` : '';
    return `${authorPart}${yearPart}`;
  }

  private formatPageRanges(pages: number[]): string {
    if (pages.length === 0) return '';

    const sorted = [...pages].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        if (i < sorted.length) {
          start = sorted[i];
          end = sorted[i];
        }
      }
    }

    return ranges.length === 1 ? `p. ${ranges[0]}` : `pp. ${ranges.join(', ')}`;
  }
}

/**
 * Create a CitationLookupTool from SmartRetrievalLayer
 */
export function createCitationLookupTool(
  retriever: CorpusRetriever,
  corpusSources: CorpusSource[] = [],
  preloadedChunks: ContextChunk[] = []
): CitationLookupTool {
  return new CitationLookupTool(retriever, corpusSources, preloadedChunks);
}
