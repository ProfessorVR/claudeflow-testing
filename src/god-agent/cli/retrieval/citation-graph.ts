/**
 * Citation Graph - Graph data structure for academic paper citations
 *
 * Part of Phase 4: Citation Graph Integration
 *
 * Features:
 * - Directed graph representation (paper A cites paper B)
 * - Co-citation analysis (papers cited together)
 * - Bibliographic coupling (papers that cite same sources)
 * - PageRank-style importance scoring
 * - Graph traversal for discovery
 *
 * @module citation-graph
 */

import { createHash } from 'crypto';

// ============================================================================
// Types
// ============================================================================

/**
 * A node in the citation graph representing a document/paper
 */
export interface CitationNode {
  /** Unique identifier for the document */
  id: string;
  /** Document title */
  title: string;
  /** Authors (if available) */
  authors?: string[];
  /** Publication year (if available) */
  year?: number;
  /** Document type (paper, book, chapter, etc.) */
  type?: 'paper' | 'book' | 'chapter' | 'thesis' | 'website' | 'unknown';
  /** Source file or URL */
  source?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** PageRank score (computed) */
  pageRankScore?: number;
  /** Number of incoming citations */
  inCitationCount?: number;
  /** Number of outgoing citations */
  outCitationCount?: number;
}

/**
 * An edge in the citation graph representing a citation relationship
 */
export interface CitationEdge {
  /** ID of the citing document */
  from: string;
  /** ID of the cited document */
  to: string;
  /** Context where citation appears (if available) */
  context?: string;
  /** Citation type */
  type?: 'direct' | 'indirect' | 'self' | 'inferred';
  /** Confidence score (0-1) for inferred citations */
  confidence?: number;
  /** Page/section where citation appears */
  location?: string;
}

/**
 * Citation graph statistics
 */
export interface CitationGraphStats {
  nodeCount: number;
  edgeCount: number;
  avgInDegree: number;
  avgOutDegree: number;
  maxInDegree: number;
  maxOutDegree: number;
  topCitedNodes: Array<{ id: string; title: string; citations: number }>;
  topCitingNodes: Array<{ id: string; title: string; citations: number }>;
  connectedComponents: number;
  density: number;
}

/**
 * Related documents result
 */
export interface RelatedDocument {
  /** Document node */
  node: CitationNode;
  /** How this document is related */
  relationshipType: 'cites' | 'cited-by' | 'co-citation' | 'bibliographic-coupling' | 'pagerank';
  /** Relevance score (higher = more relevant) */
  score: number;
  /** Explanation of the relationship */
  reason: string;
}

/**
 * PageRank configuration
 */
export interface PageRankConfig {
  /** Damping factor (default: 0.85) */
  dampingFactor?: number;
  /** Maximum iterations (default: 100) */
  maxIterations?: number;
  /** Convergence threshold (default: 1e-6) */
  tolerance?: number;
}

// ============================================================================
// Citation Graph Implementation
// ============================================================================

/**
 * Citation Graph - Manages paper citation relationships
 */
export class CitationGraph {
  private nodes: Map<string, CitationNode> = new Map();
  private edges: Map<string, CitationEdge[]> = new Map(); // from -> edges
  private reverseEdges: Map<string, CitationEdge[]> = new Map(); // to -> edges
  private pageRankScores: Map<string, number> = new Map();
  private pageRankComputed: boolean = false;

  // -------------------------------------------------------------------------
  // Node Operations
  // -------------------------------------------------------------------------

  /**
   * Add a document node to the graph
   */
  addNode(node: CitationNode): void {
    this.nodes.set(node.id, {
      ...node,
      inCitationCount: 0,
      outCitationCount: 0,
    });
    this.pageRankComputed = false;
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): CitationNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Check if node exists
   */
  hasNode(id: string): boolean {
    return this.nodes.has(id);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): CitationNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Update a node
   */
  updateNode(id: string, updates: Partial<CitationNode>): void {
    const node = this.nodes.get(id);
    if (node) {
      this.nodes.set(id, { ...node, ...updates });
    }
  }

  /**
   * Remove a node and all its edges
   */
  removeNode(id: string): void {
    // Remove outgoing edges
    const outEdges = this.edges.get(id) || [];
    for (const edge of outEdges) {
      const targetReverseEdges = this.reverseEdges.get(edge.to) || [];
      this.reverseEdges.set(
        edge.to,
        targetReverseEdges.filter((e) => e.from !== id)
      );
      // Update target's in-citation count
      const targetNode = this.nodes.get(edge.to);
      if (targetNode && targetNode.inCitationCount) {
        targetNode.inCitationCount--;
      }
    }
    this.edges.delete(id);

    // Remove incoming edges
    const inEdges = this.reverseEdges.get(id) || [];
    for (const edge of inEdges) {
      const sourceEdges = this.edges.get(edge.from) || [];
      this.edges.set(
        edge.from,
        sourceEdges.filter((e) => e.to !== id)
      );
      // Update source's out-citation count
      const sourceNode = this.nodes.get(edge.from);
      if (sourceNode && sourceNode.outCitationCount) {
        sourceNode.outCitationCount--;
      }
    }
    this.reverseEdges.delete(id);

    // Remove node
    this.nodes.delete(id);
    this.pageRankComputed = false;
  }

  // -------------------------------------------------------------------------
  // Edge Operations
  // -------------------------------------------------------------------------

  /**
   * Add a citation edge (from cites to)
   */
  addEdge(edge: CitationEdge): void {
    // Ensure both nodes exist
    if (!this.nodes.has(edge.from) || !this.nodes.has(edge.to)) {
      throw new Error(
        `Cannot add edge: nodes ${edge.from} or ${edge.to} do not exist`
      );
    }

    // Check for duplicate edges
    const existingEdges = this.edges.get(edge.from) || [];
    if (existingEdges.some((e) => e.to === edge.to)) {
      return; // Edge already exists
    }

    // Add edge
    existingEdges.push(edge);
    this.edges.set(edge.from, existingEdges);

    // Add reverse edge
    const reverseEdges = this.reverseEdges.get(edge.to) || [];
    reverseEdges.push(edge);
    this.reverseEdges.set(edge.to, reverseEdges);

    // Update citation counts
    const fromNode = this.nodes.get(edge.from)!;
    const toNode = this.nodes.get(edge.to)!;
    fromNode.outCitationCount = (fromNode.outCitationCount || 0) + 1;
    toNode.inCitationCount = (toNode.inCitationCount || 0) + 1;

    this.pageRankComputed = false;
  }

  /**
   * Get outgoing citations for a document
   */
  getCitations(id: string): CitationEdge[] {
    return this.edges.get(id) || [];
  }

  /**
   * Get incoming citations for a document (who cites this)
   */
  getCitedBy(id: string): CitationEdge[] {
    return this.reverseEdges.get(id) || [];
  }

  /**
   * Check if an edge exists
   */
  hasEdge(from: string, to: string): boolean {
    const edges = this.edges.get(from) || [];
    return edges.some((e) => e.to === to);
  }

  /**
   * Remove an edge
   */
  removeEdge(from: string, to: string): void {
    const edges = this.edges.get(from) || [];
    this.edges.set(
      from,
      edges.filter((e) => e.to !== to)
    );

    const reverseEdges = this.reverseEdges.get(to) || [];
    this.reverseEdges.set(
      to,
      reverseEdges.filter((e) => e.from !== from)
    );

    // Update citation counts
    const fromNode = this.nodes.get(from);
    const toNode = this.nodes.get(to);
    if (fromNode && fromNode.outCitationCount) {
      fromNode.outCitationCount--;
    }
    if (toNode && toNode.inCitationCount) {
      toNode.inCitationCount--;
    }

    this.pageRankComputed = false;
  }

  // -------------------------------------------------------------------------
  // PageRank
  // -------------------------------------------------------------------------

  /**
   * Compute PageRank scores for all nodes
   */
  computePageRank(config: PageRankConfig = {}): void {
    const { dampingFactor = 0.85, maxIterations = 100, tolerance = 1e-6 } =
      config;

    const nodeIds = Array.from(this.nodes.keys());
    const n = nodeIds.length;

    if (n === 0) {
      return;
    }

    // Initialize scores
    let scores = new Map<string, number>();
    const initialScore = 1 / n;
    for (const id of nodeIds) {
      scores.set(id, initialScore);
    }

    // Iteratively compute PageRank
    for (let iter = 0; iter < maxIterations; iter++) {
      const newScores = new Map<string, number>();
      let maxDelta = 0;

      for (const id of nodeIds) {
        // Get incoming citations
        const inEdges = this.reverseEdges.get(id) || [];

        // Calculate PageRank contribution from incoming links
        let sum = 0;
        for (const edge of inEdges) {
          const sourceOutDegree =
            (this.edges.get(edge.from) || []).length || 1;
          const sourceScore = scores.get(edge.from) || 0;
          sum += sourceScore / sourceOutDegree;
        }

        // Apply damping factor
        const newScore = (1 - dampingFactor) / n + dampingFactor * sum;
        newScores.set(id, newScore);

        // Track convergence
        const delta = Math.abs(newScore - (scores.get(id) || 0));
        if (delta > maxDelta) {
          maxDelta = delta;
        }
      }

      scores = newScores;

      // Check convergence
      if (maxDelta < tolerance) {
        break;
      }
    }

    // Store scores
    this.pageRankScores = scores;
    for (const [id, score] of scores) {
      const node = this.nodes.get(id);
      if (node) {
        node.pageRankScore = score;
      }
    }

    this.pageRankComputed = true;
  }

  /**
   * Get PageRank score for a node
   */
  getPageRankScore(id: string): number {
    if (!this.pageRankComputed) {
      this.computePageRank();
    }
    return this.pageRankScores.get(id) || 0;
  }

  /**
   * Get nodes sorted by PageRank score
   */
  getTopByPageRank(limit: number = 10): CitationNode[] {
    if (!this.pageRankComputed) {
      this.computePageRank();
    }

    return Array.from(this.nodes.values())
      .sort((a, b) => (b.pageRankScore || 0) - (a.pageRankScore || 0))
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // Co-Citation Analysis
  // -------------------------------------------------------------------------

  /**
   * Find documents that are frequently co-cited with the given document
   * (Papers that are often cited together with this one)
   */
  findCoCitations(id: string, limit: number = 10): RelatedDocument[] {
    const citedBy = this.getCitedBy(id);
    const coCitationCounts = new Map<string, number>();

    // For each paper that cites this document...
    for (const edge of citedBy) {
      // Get what else that paper cites
      const siblingCitations = this.getCitations(edge.from);
      for (const sibling of siblingCitations) {
        if (sibling.to !== id) {
          const count = coCitationCounts.get(sibling.to) || 0;
          coCitationCounts.set(sibling.to, count + 1);
        }
      }
    }

    // Convert to sorted results
    const results: RelatedDocument[] = [];
    for (const [nodeId, count] of coCitationCounts) {
      const node = this.nodes.get(nodeId);
      if (node) {
        results.push({
          node,
          relationshipType: 'co-citation',
          score: count / Math.max(1, citedBy.length), // Normalize by citing papers
          reason: `Co-cited with this document in ${count} paper(s)`,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Find documents with similar reference lists (bibliographic coupling)
   * (Papers that cite the same sources)
   */
  findBibliographicCoupling(
    id: string,
    limit: number = 10
  ): RelatedDocument[] {
    const myCitations = this.getCitations(id);
    const myCitedSet = new Set(myCitations.map((e) => e.to));

    if (myCitations.length === 0) {
      return [];
    }

    const couplingCounts = new Map<string, number>();

    // For each paper this document cites...
    for (const citation of myCitations) {
      // Find other papers that cite the same source
      const siblings = this.getCitedBy(citation.to);
      for (const sibling of siblings) {
        if (sibling.from !== id) {
          const count = couplingCounts.get(sibling.from) || 0;
          couplingCounts.set(sibling.from, count + 1);
        }
      }
    }

    // Convert to sorted results
    const results: RelatedDocument[] = [];
    for (const [nodeId, count] of couplingCounts) {
      const node = this.nodes.get(nodeId);
      if (node) {
        results.push({
          node,
          relationshipType: 'bibliographic-coupling',
          score: count / myCitations.length, // Jaccard-like similarity
          reason: `Shares ${count} reference(s) with this document`,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // Graph Traversal
  // -------------------------------------------------------------------------

  /**
   * Find related documents through graph traversal
   */
  findRelated(
    id: string,
    options: {
      maxDepth?: number;
      limit?: number;
      includeTypes?: Array<RelatedDocument['relationshipType']>;
    } = {}
  ): RelatedDocument[] {
    const {
      maxDepth = 2,
      limit = 20,
      includeTypes = [
        'cites',
        'cited-by',
        'co-citation',
        'bibliographic-coupling',
        'pagerank',
      ],
    } = options;

    if (!this.hasNode(id)) {
      return [];
    }

    const results: RelatedDocument[] = [];
    const seen = new Set<string>([id]);

    // Direct citations (what this paper cites)
    if (includeTypes.includes('cites')) {
      const citations = this.getCitations(id);
      for (const edge of citations) {
        const node = this.nodes.get(edge.to);
        if (node && !seen.has(edge.to)) {
          seen.add(edge.to);
          results.push({
            node,
            relationshipType: 'cites',
            score: 1.0 - (results.length * 0.01), // Slight decay for ordering
            reason: 'Directly cited by this document',
          });
        }
      }
    }

    // Cited by (papers that cite this)
    if (includeTypes.includes('cited-by')) {
      const citedBy = this.getCitedBy(id);
      for (const edge of citedBy) {
        const node = this.nodes.get(edge.from);
        if (node && !seen.has(edge.from)) {
          seen.add(edge.from);
          results.push({
            node,
            relationshipType: 'cited-by',
            score: 0.9 - (results.length * 0.01),
            reason: 'Cites this document',
          });
        }
      }
    }

    // Co-citations
    if (includeTypes.includes('co-citation')) {
      const coCitations = this.findCoCitations(id, Math.floor(limit / 4));
      for (const doc of coCitations) {
        if (!seen.has(doc.node.id)) {
          seen.add(doc.node.id);
          results.push(doc);
        }
      }
    }

    // Bibliographic coupling
    if (includeTypes.includes('bibliographic-coupling')) {
      const coupled = this.findBibliographicCoupling(
        id,
        Math.floor(limit / 4)
      );
      for (const doc of coupled) {
        if (!seen.has(doc.node.id)) {
          seen.add(doc.node.id);
          results.push(doc);
        }
      }
    }

    // PageRank-based recommendations (for depth > 1)
    if (includeTypes.includes('pagerank') && maxDepth > 1) {
      const topByPageRank = this.getTopByPageRank(limit);
      for (const node of topByPageRank) {
        if (!seen.has(node.id)) {
          seen.add(node.id);
          results.push({
            node,
            relationshipType: 'pagerank',
            score: node.pageRankScore || 0,
            reason: `High-importance document (PageRank: ${(node.pageRankScore || 0).toFixed(4)})`,
          });
        }
      }
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // -------------------------------------------------------------------------
  // Statistics
  // -------------------------------------------------------------------------

  /**
   * Get graph statistics
   */
  getStats(): CitationGraphStats {
    const nodes = Array.from(this.nodes.values());
    const nodeCount = nodes.length;
    let edgeCount = 0;
    let maxInDegree = 0;
    let maxOutDegree = 0;

    const inDegrees: number[] = [];
    const outDegrees: number[] = [];

    for (const node of nodes) {
      const inDegree = node.inCitationCount || 0;
      const outDegree = node.outCitationCount || 0;
      inDegrees.push(inDegree);
      outDegrees.push(outDegree);
      edgeCount += outDegree;

      if (inDegree > maxInDegree) maxInDegree = inDegree;
      if (outDegree > maxOutDegree) maxOutDegree = outDegree;
    }

    const avgInDegree =
      nodeCount > 0
        ? inDegrees.reduce((a, b) => a + b, 0) / nodeCount
        : 0;
    const avgOutDegree =
      nodeCount > 0
        ? outDegrees.reduce((a, b) => a + b, 0) / nodeCount
        : 0;

    // Top cited nodes
    const topCitedNodes = nodes
      .filter((n) => (n.inCitationCount || 0) > 0)
      .sort((a, b) => (b.inCitationCount || 0) - (a.inCitationCount || 0))
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.title,
        citations: n.inCitationCount || 0,
      }));

    // Top citing nodes
    const topCitingNodes = nodes
      .filter((n) => (n.outCitationCount || 0) > 0)
      .sort((a, b) => (b.outCitationCount || 0) - (a.outCitationCount || 0))
      .slice(0, 5)
      .map((n) => ({
        id: n.id,
        title: n.title,
        citations: n.outCitationCount || 0,
      }));

    // Connected components (simplified - just count isolates)
    const isolatedNodes = nodes.filter(
      (n) =>
        (n.inCitationCount || 0) === 0 && (n.outCitationCount || 0) === 0
    ).length;

    // Graph density
    const maxPossibleEdges = nodeCount * (nodeCount - 1);
    const density =
      maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

    return {
      nodeCount,
      edgeCount,
      avgInDegree,
      avgOutDegree,
      maxInDegree,
      maxOutDegree,
      topCitedNodes,
      topCitingNodes,
      connectedComponents: isolatedNodes + 1, // Simplified
      density,
    };
  }

  // -------------------------------------------------------------------------
  // Serialization
  // -------------------------------------------------------------------------

  /**
   * Serialize graph to JSON
   */
  toJSON(): {
    nodes: CitationNode[];
    edges: CitationEdge[];
  } {
    const edges: CitationEdge[] = [];
    for (const edgeList of this.edges.values()) {
      edges.push(...edgeList);
    }
    return {
      nodes: Array.from(this.nodes.values()),
      edges,
    };
  }

  /**
   * Load graph from JSON
   */
  static fromJSON(data: {
    nodes: CitationNode[];
    edges: CitationEdge[];
  }): CitationGraph {
    const graph = new CitationGraph();

    // Add nodes first
    for (const node of data.nodes) {
      graph.addNode(node);
    }

    // Add edges
    for (const edge of data.edges) {
      try {
        graph.addEdge(edge);
      } catch {
        // Skip invalid edges (missing nodes)
      }
    }

    return graph;
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
    this.edges.clear();
    this.reverseEdges.clear();
    this.pageRankScores.clear();
    this.pageRankComputed = false;
  }

  /**
   * Get node count
   */
  get size(): number {
    return this.nodes.size;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a deterministic ID from title (for deduplication)
 */
export function generateCitationId(title: string, authors?: string[]): string {
  const normalized = title.toLowerCase().trim();
  const authorStr = authors ? authors.join(',').toLowerCase() : '';
  const hash = createHash('md5')
    .update(normalized + authorStr)
    .digest('hex');
  return `cite_${hash.substring(0, 12)}`;
}

/**
 * Create a new citation graph
 */
export function createCitationGraph(): CitationGraph {
  return new CitationGraph();
}

export default CitationGraph;
