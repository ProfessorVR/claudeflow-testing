/**
 * Citation Expander - Expand search results using citation relationships
 *
 * Part of Phase 4: Citation Graph Integration
 *
 * Features:
 * - Expand retrieval results through citation graph
 * - Boost scores for highly-cited documents
 * - Include related papers via co-citation
 * - Integrate with hybrid retrieval pipeline
 *
 * @module citation-expander
 */

import {
  CitationGraph,
  CitationNode,
  RelatedDocument,
} from './citation-graph.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A search result that can be expanded
 */
export interface ExpandableResult {
  /** Document ID */
  id: string;
  /** Original score from retrieval */
  score: number;
  /** Document content */
  content: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Expanded search result
 */
export interface ExpandedResult {
  /** Document ID */
  id: string;
  /** Combined score (original + citation boost) */
  score: number;
  /** Original retrieval score */
  originalScore: number;
  /** Citation-based boost */
  citationBoost: number;
  /** Document content */
  content: string;
  /** Citation node (if in graph) */
  citationNode?: CitationNode;
  /** How this result was found */
  source: 'direct' | 'citation-expansion' | 'co-citation' | 'pagerank';
  /** Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Expansion configuration
 */
export interface CitationExpanderConfig {
  /** Enable citation-based expansion (default: true) */
  enableExpansion?: boolean;
  /** Weight for citation boost (default: 0.3) */
  citationWeight?: number;
  /** Maximum expansion candidates (default: 5) */
  maxExpansion?: number;
  /** Minimum PageRank score to include (default: 0.001) */
  minPageRankScore?: number;
  /** Use co-citation for expansion (default: true) */
  useCoCitation?: boolean;
  /** Use bibliographic coupling for expansion (default: true) */
  useBibliographicCoupling?: boolean;
  /** Use PageRank for scoring (default: true) */
  usePageRank?: boolean;
}

/**
 * Expansion statistics
 */
export interface ExpansionStats {
  originalCount: number;
  expandedCount: number;
  citationMatches: number;
  coCitationMatches: number;
  bibliographicMatches: number;
  pageRankBoosted: number;
  avgCitationBoost: number;
}

// ============================================================================
// Citation Expander Implementation
// ============================================================================

/**
 * Expand search results using citation graph relationships
 */
export class CitationExpander {
  private graph: CitationGraph;
  private config: Required<CitationExpanderConfig>;

  constructor(graph: CitationGraph, config: CitationExpanderConfig = {}) {
    this.graph = graph;
    this.config = {
      enableExpansion: config.enableExpansion ?? true,
      citationWeight: config.citationWeight ?? 0.3,
      maxExpansion: config.maxExpansion ?? 5,
      minPageRankScore: config.minPageRankScore ?? 0.001,
      useCoCitation: config.useCoCitation ?? true,
      useBibliographicCoupling: config.useBibliographicCoupling ?? true,
      usePageRank: config.usePageRank ?? true,
    };
  }

  /**
   * Expand search results using citation relationships
   */
  expand(
    results: ExpandableResult[],
    limit: number = 10
  ): {
    results: ExpandedResult[];
    stats: ExpansionStats;
  } {
    const stats: ExpansionStats = {
      originalCount: results.length,
      expandedCount: 0,
      citationMatches: 0,
      coCitationMatches: 0,
      bibliographicMatches: 0,
      pageRankBoosted: 0,
      avgCitationBoost: 0,
    };

    if (!this.config.enableExpansion || this.graph.size === 0) {
      // No expansion - just convert results
      return {
        results: results.slice(0, limit).map((r) => ({
          id: r.id,
          score: r.score,
          originalScore: r.score,
          citationBoost: 0,
          content: r.content,
          source: 'direct' as const,
          metadata: r.metadata,
        })),
        stats,
      };
    }

    const expandedMap = new Map<string, ExpandedResult>();
    let totalCitationBoost = 0;

    // Process original results
    for (const result of results) {
      const citationNode = this.graph.getNode(result.id);
      let citationBoost = 0;

      if (citationNode) {
        stats.citationMatches++;

        // Boost based on incoming citations
        const inCitations = citationNode.inCitationCount || 0;
        const citationScore = Math.log1p(inCitations) / 10; // Log scale

        // Boost based on PageRank
        let pageRankBoost = 0;
        if (this.config.usePageRank) {
          const prScore = this.graph.getPageRankScore(result.id);
          if (prScore >= this.config.minPageRankScore) {
            pageRankBoost = prScore * 10; // Scale up
            stats.pageRankBoosted++;
          }
        }

        citationBoost =
          (citationScore + pageRankBoost) * this.config.citationWeight;
        totalCitationBoost += citationBoost;
      }

      expandedMap.set(result.id, {
        id: result.id,
        score: result.score + citationBoost,
        originalScore: result.score,
        citationBoost,
        content: result.content,
        citationNode,
        source: 'direct',
        metadata: result.metadata,
      });
    }

    // Expand through citation relationships
    const seenIds = new Set(results.map((r) => r.id));
    const expansionCandidates: RelatedDocument[] = [];

    for (const result of results) {
      if (!this.graph.hasNode(result.id)) continue;

      // Get related documents
      const related = this.graph.findRelated(result.id, {
        maxDepth: 1,
        limit: this.config.maxExpansion,
        includeTypes: [
          ...(this.config.useCoCitation ? ['co-citation' as const] : []),
          ...(this.config.useBibliographicCoupling
            ? ['bibliographic-coupling' as const]
            : []),
        ],
      });

      for (const rel of related) {
        if (!seenIds.has(rel.node.id)) {
          expansionCandidates.push({
            ...rel,
            // Reduce score for expansion results
            score: rel.score * 0.7,
          });
          seenIds.add(rel.node.id);

          // Update stats
          if (rel.relationshipType === 'co-citation') {
            stats.coCitationMatches++;
          } else if (rel.relationshipType === 'bibliographic-coupling') {
            stats.bibliographicMatches++;
          }
        }
      }
    }

    // Add expansion candidates to results
    for (const candidate of expansionCandidates) {
      // Calculate score based on relationship
      const baseScore =
        candidate.score * this.config.citationWeight * 0.5; // Lower than direct matches

      expandedMap.set(candidate.node.id, {
        id: candidate.node.id,
        score: baseScore,
        originalScore: 0,
        citationBoost: baseScore,
        content: candidate.node.title, // Use title as content placeholder
        citationNode: candidate.node,
        source: candidate.relationshipType as 'co-citation' | 'pagerank',
        metadata: {
          relationshipType: candidate.relationshipType,
          reason: candidate.reason,
        },
      });
      stats.expandedCount++;
    }

    // Calculate average boost
    stats.avgCitationBoost =
      stats.citationMatches > 0
        ? totalCitationBoost / stats.citationMatches
        : 0;

    // Sort by combined score and return top results
    const sortedResults = Array.from(expandedMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return { results: sortedResults, stats };
  }

  /**
   * Boost results by PageRank scores
   */
  boostByPageRank(results: ExpandableResult[]): ExpandableResult[] {
    if (!this.config.usePageRank || this.graph.size === 0) {
      return results;
    }

    // Ensure PageRank is computed
    this.graph.computePageRank();

    return results.map((result) => {
      const prScore = this.graph.getPageRankScore(result.id);
      if (prScore >= this.config.minPageRankScore) {
        return {
          ...result,
          score: result.score * (1 + prScore * this.config.citationWeight),
        };
      }
      return result;
    });
  }

  /**
   * Get expansion suggestions for a query
   */
  suggestExpansions(
    resultIds: string[],
    limit: number = 5
  ): RelatedDocument[] {
    const suggestions: RelatedDocument[] = [];
    const seen = new Set(resultIds);

    for (const id of resultIds) {
      if (!this.graph.hasNode(id)) continue;

      const related = this.graph.findRelated(id, {
        maxDepth: 1,
        limit: Math.ceil(limit / resultIds.length),
        includeTypes: ['co-citation', 'bibliographic-coupling', 'cites'],
      });

      for (const rel of related) {
        if (!seen.has(rel.node.id)) {
          seen.add(rel.node.id);
          suggestions.push(rel);
        }
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate citation-aware similarity between two documents
   */
  citationSimilarity(id1: string, id2: string): number {
    if (!this.graph.hasNode(id1) || !this.graph.hasNode(id2)) {
      return 0;
    }

    let similarity = 0;
    let factors = 0;

    // Direct citation relationship
    if (this.graph.hasEdge(id1, id2) || this.graph.hasEdge(id2, id1)) {
      similarity += 1.0;
      factors++;
    }

    // Co-citation (cited together)
    const coCitations1 = this.graph.findCoCitations(id1, 50);
    const coCitedWith = coCitations1.find((c) => c.node.id === id2);
    if (coCitedWith) {
      similarity += coCitedWith.score;
      factors++;
    }

    // Bibliographic coupling (cite same sources)
    const coupled1 = this.graph.findBibliographicCoupling(id1, 50);
    const coupledWith = coupled1.find((c) => c.node.id === id2);
    if (coupledWith) {
      similarity += coupledWith.score;
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  /**
   * Get the citation graph
   */
  getGraph(): CitationGraph {
    return this.graph;
  }

  /**
   * Update the citation graph
   */
  setGraph(graph: CitationGraph): void {
    this.graph = graph;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<CitationExpanderConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CitationExpanderConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a citation expander
 */
export function createCitationExpander(
  graph: CitationGraph,
  config?: CitationExpanderConfig
): CitationExpander {
  return new CitationExpander(graph, config);
}

export default CitationExpander;
