/**
 * Citation Graph Tests
 *
 * Comprehensive tests for the citation graph data structure.
 * Part of Phase 4: Citation Graph Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CitationGraph,
  createCitationGraph,
  generateCitationId,
  type CitationNode,
  type CitationEdge,
  type PageRankConfig,
} from '../../../../src/god-agent/cli/retrieval/citation-graph.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const SAMPLE_NODES: CitationNode[] = [
  {
    id: 'paper-1',
    title: 'Foundations of Deep Learning',
    authors: ['Smith', 'Jones'],
    year: 2018,
    type: 'paper',
  },
  {
    id: 'paper-2',
    title: 'Advances in Neural Networks',
    authors: ['Brown', 'Davis'],
    year: 2019,
    type: 'paper',
  },
  {
    id: 'paper-3',
    title: 'Attention Mechanisms Explained',
    authors: ['Wilson'],
    year: 2020,
    type: 'paper',
  },
  {
    id: 'paper-4',
    title: 'Transformer Architecture',
    authors: ['Taylor', 'Anderson'],
    year: 2021,
    type: 'paper',
  },
  {
    id: 'paper-5',
    title: 'Modern NLP Systems',
    authors: ['Lee', 'Kim'],
    year: 2022,
    type: 'paper',
  },
];

const SAMPLE_EDGES: CitationEdge[] = [
  { from: 'paper-2', to: 'paper-1', type: 'direct', confidence: 1.0 },
  { from: 'paper-3', to: 'paper-1', type: 'direct', confidence: 1.0 },
  { from: 'paper-3', to: 'paper-2', type: 'direct', confidence: 1.0 },
  { from: 'paper-4', to: 'paper-2', type: 'direct', confidence: 1.0 },
  { from: 'paper-4', to: 'paper-3', type: 'direct', confidence: 0.9 },
  { from: 'paper-5', to: 'paper-3', type: 'direct', confidence: 1.0 },
  { from: 'paper-5', to: 'paper-4', type: 'direct', confidence: 1.0 },
];

function createPopulatedGraph(): CitationGraph {
  const graph = createCitationGraph();
  SAMPLE_NODES.forEach((node) => graph.addNode(node));
  SAMPLE_EDGES.forEach((edge) => graph.addEdge(edge));
  return graph;
}

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('CitationGraph - Basic Functionality', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createCitationGraph();
  });

  it('should create empty graph', () => {
    expect(graph).toBeDefined();
    expect(graph).toBeInstanceOf(CitationGraph);
    expect(graph.size).toBe(0);
  });

  it('should add nodes', () => {
    graph.addNode(SAMPLE_NODES[0]);
    expect(graph.size).toBe(1);
    expect(graph.hasNode('paper-1')).toBe(true);
  });

  it('should add edges', () => {
    graph.addNode(SAMPLE_NODES[0]);
    graph.addNode(SAMPLE_NODES[1]);
    graph.addEdge(SAMPLE_EDGES[0]);

    expect(graph.hasEdge('paper-2', 'paper-1')).toBe(true);
  });

  it('should retrieve nodes', () => {
    graph.addNode(SAMPLE_NODES[0]);
    const node = graph.getNode('paper-1');

    expect(node).toBeDefined();
    expect(node?.title).toBe('Foundations of Deep Learning');
    expect(node?.authors).toEqual(['Smith', 'Jones']);
  });

  it('should return undefined for non-existent node', () => {
    expect(graph.getNode('non-existent')).toBeUndefined();
  });

  it('should check node existence', () => {
    graph.addNode(SAMPLE_NODES[0]);
    expect(graph.hasNode('paper-1')).toBe(true);
    expect(graph.hasNode('paper-999')).toBe(false);
  });

  it('should check edge existence', () => {
    graph.addNode(SAMPLE_NODES[0]);
    graph.addNode(SAMPLE_NODES[1]);
    graph.addEdge(SAMPLE_EDGES[0]);

    expect(graph.hasEdge('paper-2', 'paper-1')).toBe(true);
    expect(graph.hasEdge('paper-1', 'paper-2')).toBe(false);
  });

  it('should not add duplicate nodes', () => {
    graph.addNode(SAMPLE_NODES[0]);
    graph.addNode(SAMPLE_NODES[0]); // Duplicate

    expect(graph.size).toBe(1);
  });

  it('should throw error when adding edges to non-existent nodes', () => {
    // Only add source node, not target
    graph.addNode(SAMPLE_NODES[1]);

    expect(() => {
      graph.addEdge(SAMPLE_EDGES[0]); // paper-2 -> paper-1, but paper-1 doesn't exist
    }).toThrow('Cannot add edge');
  });
});

// ============================================================================
// Citation Counting Tests
// ============================================================================

describe('CitationGraph - Citation Counts', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createPopulatedGraph();
  });

  it('should track incoming citation count', () => {
    const paper1 = graph.getNode('paper-1');
    const paper3 = graph.getNode('paper-3');

    // paper-1 is cited by paper-2 and paper-3
    expect(paper1?.inCitationCount).toBe(2);
    // paper-3 is cited by paper-4 and paper-5
    expect(paper3?.inCitationCount).toBe(2);
  });

  it('should track outgoing citation count', () => {
    const paper5 = graph.getNode('paper-5');
    // paper-5 cites paper-3 and paper-4
    expect(paper5?.outCitationCount).toBe(2);
  });

  it('should get citations (outgoing edges)', () => {
    const citations = graph.getCitations('paper-5');
    const citedIds = citations.map((c) => c.to);
    expect(citedIds).toContain('paper-3');
    expect(citedIds).toContain('paper-4');
  });

  it('should get cited-by (incoming edges)', () => {
    const citedBy = graph.getCitedBy('paper-1');
    const citingIds = citedBy.map((c) => c.from);
    expect(citingIds).toContain('paper-2');
    expect(citingIds).toContain('paper-3');
  });
});

// ============================================================================
// PageRank Tests
// ============================================================================

describe('CitationGraph - PageRank', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createPopulatedGraph();
  });

  it('should compute PageRank scores', () => {
    graph.computePageRank();

    // All nodes should have PageRank scores
    for (const node of SAMPLE_NODES) {
      const score = graph.getPageRankScore(node.id);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('should give higher scores to highly-cited papers', () => {
    graph.computePageRank();

    // paper-1 is cited by 2 papers, paper-5 cites 2 but is not cited
    const score1 = graph.getPageRankScore('paper-1');
    const score5 = graph.getPageRankScore('paper-5');

    expect(score1).toBeGreaterThan(score5);
  });

  it('should produce positive PageRank scores', () => {
    graph.computePageRank();

    let totalScore = 0;
    for (const node of SAMPLE_NODES) {
      totalScore += graph.getPageRankScore(node.id);
    }

    // Total should be positive
    expect(totalScore).toBeGreaterThan(0);
  });

  it('should respect custom damping factor', () => {
    const config: PageRankConfig = { dampingFactor: 0.5 };
    graph.computePageRank(config);

    // Should still compute valid scores
    for (const node of SAMPLE_NODES) {
      const score = graph.getPageRankScore(node.id);
      expect(score).toBeGreaterThan(0);
    }
  });

  it('should respect iteration limit', () => {
    const config: PageRankConfig = { maxIterations: 5 };
    graph.computePageRank(config);

    // Should compute without error
    const score = graph.getPageRankScore('paper-1');
    expect(score).toBeGreaterThan(0);
  });

  it('should return 0 for non-existent node', () => {
    graph.computePageRank();
    expect(graph.getPageRankScore('non-existent')).toBe(0);
  });

  it('should get top nodes by PageRank', () => {
    graph.computePageRank();
    const topNodes = graph.getTopByPageRank(3);

    expect(topNodes.length).toBeLessThanOrEqual(3);
    expect(topNodes.length).toBeGreaterThan(0);

    // Should be sorted by PageRank descending
    for (let i = 1; i < topNodes.length; i++) {
      expect(topNodes[i - 1].pageRankScore).toBeGreaterThanOrEqual(
        topNodes[i].pageRankScore || 0
      );
    }
  });
});

// ============================================================================
// Co-Citation Tests
// ============================================================================

describe('CitationGraph - Co-Citation Analysis', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createPopulatedGraph();
  });

  it('should find co-cited papers', () => {
    // paper-1 and paper-2 are both cited by paper-3
    const coCitations = graph.findCoCitations('paper-1', 10);

    expect(coCitations.length).toBeGreaterThan(0);
    const coCitedIds = coCitations.map((c) => c.node.id);
    expect(coCitedIds).toContain('paper-2');
  });

  it('should score co-citations based on frequency', () => {
    const coCitations = graph.findCoCitations('paper-1', 10);

    // All scores should be positive
    coCitations.forEach((c) => {
      expect(c.score).toBeGreaterThan(0);
      expect(c.relationshipType).toBe('co-citation');
    });
  });

  it('should respect limit parameter', () => {
    const coCitations = graph.findCoCitations('paper-1', 1);
    expect(coCitations.length).toBeLessThanOrEqual(1);
  });

  it('should return empty for node with no co-citations', () => {
    // paper-5 is not cited by anyone, so no co-citations
    const coCitations = graph.findCoCitations('paper-5', 10);
    expect(coCitations.length).toBe(0);
  });

  it('should include reason in co-citation result', () => {
    const coCitations = graph.findCoCitations('paper-1', 10);
    if (coCitations.length > 0) {
      expect(coCitations[0].reason).toBeDefined();
      expect(typeof coCitations[0].reason).toBe('string');
    }
  });
});

// ============================================================================
// Bibliographic Coupling Tests
// ============================================================================

describe('CitationGraph - Bibliographic Coupling', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createPopulatedGraph();
  });

  it('should find bibliographically coupled papers', () => {
    // paper-3 and paper-4 both cite paper-2
    const coupled = graph.findBibliographicCoupling('paper-3', 10);

    const coupledIds = coupled.map((c) => c.node.id);
    expect(coupledIds).toContain('paper-4');
  });

  it('should score coupling based on shared references', () => {
    const coupled = graph.findBibliographicCoupling('paper-3', 10);

    coupled.forEach((c) => {
      expect(c.score).toBeGreaterThan(0);
      expect(c.relationshipType).toBe('bibliographic-coupling');
    });
  });

  it('should respect limit parameter', () => {
    const coupled = graph.findBibliographicCoupling('paper-3', 1);
    expect(coupled.length).toBeLessThanOrEqual(1);
  });

  it('should return empty for node with no outgoing citations', () => {
    // paper-1 doesn't cite anything
    const coupled = graph.findBibliographicCoupling('paper-1', 10);
    expect(coupled.length).toBe(0);
  });
});

// ============================================================================
// Related Finding Tests
// ============================================================================

describe('CitationGraph - Find Related', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createPopulatedGraph();
  });

  it('should find related papers through multiple methods', () => {
    const related = graph.findRelated('paper-3', {
      limit: 10,
      includeTypes: ['co-citation', 'bibliographic-coupling', 'cites', 'cited-by'],
    });

    expect(related.length).toBeGreaterThan(0);
  });

  it('should filter by relationship type', () => {
    const onlyCoCitation = graph.findRelated('paper-1', {
      limit: 10,
      includeTypes: ['co-citation'],
    });

    onlyCoCitation.forEach((r) => {
      expect(r.relationshipType).toBe('co-citation');
    });
  });

  it('should respect maxDepth for graph traversal', () => {
    const shallow = graph.findRelated('paper-5', {
      limit: 10,
      maxDepth: 1,
      includeTypes: ['cites'],
    });

    // Should only include direct citations
    expect(shallow.length).toBeLessThanOrEqual(2);
  });

  it('should sort by score descending', () => {
    const related = graph.findRelated('paper-3', {
      limit: 10,
      includeTypes: ['co-citation', 'bibliographic-coupling'],
    });

    for (let i = 1; i < related.length; i++) {
      expect(related[i - 1].score).toBeGreaterThanOrEqual(related[i].score);
    }
  });

  it('should return empty for non-existent node', () => {
    const related = graph.findRelated('non-existent', { limit: 10 });
    expect(related.length).toBe(0);
  });
});

// ============================================================================
// Graph Statistics Tests
// ============================================================================

describe('CitationGraph - Statistics', () => {
  it('should compute correct stats for populated graph', () => {
    const graph = createPopulatedGraph();
    const stats = graph.getStats();

    expect(stats.nodeCount).toBe(5);
    expect(stats.edgeCount).toBe(7);
    expect(stats.avgInDegree).toBeGreaterThan(0);
    expect(stats.avgOutDegree).toBeGreaterThan(0);
    expect(stats.maxInDegree).toBeGreaterThan(0);
    expect(stats.maxOutDegree).toBeGreaterThan(0);
  });

  it('should handle empty graph stats', () => {
    const graph = createCitationGraph();
    const stats = graph.getStats();

    expect(stats.nodeCount).toBe(0);
    expect(stats.edgeCount).toBe(0);
    expect(stats.avgInDegree).toBe(0);
    expect(stats.avgOutDegree).toBe(0);
  });

  it('should identify most cited nodes', () => {
    const graph = createPopulatedGraph();
    const stats = graph.getStats();

    // paper-1 and paper-3 are most cited (2 each)
    expect(stats.maxInDegree).toBe(2);
  });

  it('should compute graph density', () => {
    const graph = createPopulatedGraph();
    const stats = graph.getStats();

    expect(stats.density).toBeGreaterThan(0);
    expect(stats.density).toBeLessThanOrEqual(1);
  });
});

// ============================================================================
// Serialization Tests
// ============================================================================

describe('CitationGraph - Serialization', () => {
  it('should serialize to JSON', () => {
    const graph = createPopulatedGraph();
    const json = graph.toJSON();

    expect(json.nodes).toHaveLength(5);
    expect(json.edges).toHaveLength(7);
  });

  it('should deserialize from JSON', () => {
    const original = createPopulatedGraph();
    const json = original.toJSON();

    const restored = CitationGraph.fromJSON(json);

    expect(restored.size).toBe(original.size);
    expect(restored.hasNode('paper-1')).toBe(true);
    expect(restored.hasEdge('paper-2', 'paper-1')).toBe(true);
  });

  it('should preserve PageRank scores in serialization', () => {
    const original = createPopulatedGraph();
    original.computePageRank();
    const json = original.toJSON();

    const restored = CitationGraph.fromJSON(json);

    // PageRank scores should be preserved (stored in nodes)
    const originalScore = original.getPageRankScore('paper-1');
    const restoredNode = restored.getNode('paper-1');
    expect(restoredNode?.pageRankScore).toBeCloseTo(originalScore, 5);
  });

  it('should handle empty graph serialization', () => {
    const graph = createCitationGraph();
    const json = graph.toJSON();

    expect(json.nodes).toHaveLength(0);
    expect(json.edges).toHaveLength(0);

    const restored = CitationGraph.fromJSON(json);
    expect(restored.size).toBe(0);
  });
});

// ============================================================================
// ID Generation Tests
// ============================================================================

describe('generateCitationId', () => {
  it('should generate consistent IDs', () => {
    const id1 = generateCitationId('Test Title', ['Author1']);
    const id2 = generateCitationId('Test Title', ['Author1']);

    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different titles', () => {
    const id1 = generateCitationId('Title A', ['Author']);
    const id2 = generateCitationId('Title B', ['Author']);

    expect(id1).not.toBe(id2);
  });

  it('should handle empty authors', () => {
    const id = generateCitationId('Test Title');
    expect(id).toBeDefined();
    expect(id.length).toBeGreaterThan(0);
  });

  it('should normalize titles for ID generation', () => {
    const id1 = generateCitationId('Test Title');
    const id2 = generateCitationId('TEST TITLE');

    expect(id1).toBe(id2);
  });

  it('should include author in ID when provided', () => {
    const idWithAuthor = generateCitationId('Title', ['Smith']);
    const idWithoutAuthor = generateCitationId('Title');

    expect(idWithAuthor).not.toBe(idWithoutAuthor);
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('CitationGraph - Edge Cases', () => {
  let graph: CitationGraph;

  beforeEach(() => {
    graph = createCitationGraph();
  });

  it('should handle self-citation', () => {
    graph.addNode(SAMPLE_NODES[0]);
    graph.addEdge({
      from: 'paper-1',
      to: 'paper-1',
      type: 'direct',
      confidence: 1.0,
    });

    // Self-citation should be allowed but handled gracefully
    expect(graph.hasEdge('paper-1', 'paper-1')).toBe(true);
  });

  it('should handle duplicate edges silently', () => {
    graph.addNode(SAMPLE_NODES[0]);
    graph.addNode(SAMPLE_NODES[1]);
    graph.addEdge(SAMPLE_EDGES[0]);
    graph.addEdge(SAMPLE_EDGES[0]); // Duplicate - should be ignored

    // Should not create duplicate
    const edges = graph.getCitations('paper-2');
    expect(edges.length).toBe(1);
  });

  it('should handle nodes with no connections', () => {
    graph.addNode(SAMPLE_NODES[0]);

    const related = graph.findRelated('paper-1', { limit: 10 });
    expect(related.length).toBe(0);

    graph.computePageRank();
    const score = graph.getPageRankScore('paper-1');
    expect(score).toBeGreaterThan(0); // Should still have base score
  });

  it('should handle large graphs efficiently', () => {
    // Create a larger graph
    for (let i = 0; i < 100; i++) {
      graph.addNode({
        id: `paper-${i}`,
        title: `Paper ${i}`,
        type: 'paper',
      });
    }

    // Add random edges
    for (let i = 1; i < 100; i++) {
      graph.addEdge({
        from: `paper-${i}`,
        to: `paper-${Math.floor(Math.random() * i)}`,
        type: 'direct',
        confidence: 1.0,
      });
    }

    const startTime = Date.now();
    graph.computePageRank();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1s
    expect(graph.size).toBe(100);
  });

  it('should clear graph correctly', () => {
    const populated = createPopulatedGraph();
    populated.computePageRank();

    populated.clear();

    expect(populated.size).toBe(0);
    expect(populated.hasNode('paper-1')).toBe(false);
  });

  it('should remove nodes correctly', () => {
    const populated = createPopulatedGraph();

    populated.removeNode('paper-3');

    expect(populated.size).toBe(4);
    expect(populated.hasNode('paper-3')).toBe(false);
    expect(populated.hasEdge('paper-3', 'paper-1')).toBe(false);
    expect(populated.hasEdge('paper-4', 'paper-3')).toBe(false);
  });

  it('should remove edges correctly', () => {
    const populated = createPopulatedGraph();

    populated.removeEdge('paper-2', 'paper-1');

    expect(populated.hasEdge('paper-2', 'paper-1')).toBe(false);
    expect(populated.getNode('paper-1')?.inCitationCount).toBe(1);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('CitationGraph - Integration', () => {
  it('should support full workflow', () => {
    const graph = createCitationGraph();

    // Build graph
    SAMPLE_NODES.forEach((node) => graph.addNode(node));
    SAMPLE_EDGES.forEach((edge) => graph.addEdge(edge));

    // Compute PageRank
    graph.computePageRank();

    // Find related for each node
    for (const node of SAMPLE_NODES) {
      const related = graph.findRelated(node.id, {
        limit: 5,
        includeTypes: ['co-citation', 'bibliographic-coupling'],
      });

      // Each node should have well-formed related results
      related.forEach((r) => {
        expect(r.node).toBeDefined();
        expect(r.score).toBeGreaterThanOrEqual(0);
        expect(r.relationshipType).toBeDefined();
      });
    }

    // Serialize and restore
    const json = graph.toJSON();
    const restored = CitationGraph.fromJSON(json);

    expect(restored.size).toBe(graph.size);
  });

  it('should get all nodes', () => {
    const graph = createPopulatedGraph();
    const allNodes = graph.getAllNodes();

    expect(allNodes.length).toBe(5);
    expect(allNodes.map((n) => n.id)).toContain('paper-1');
  });

  it('should update nodes', () => {
    const graph = createPopulatedGraph();

    graph.updateNode('paper-1', { title: 'Updated Title' });

    const node = graph.getNode('paper-1');
    expect(node?.title).toBe('Updated Title');
  });
});
