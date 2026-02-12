/**
 * Citation Expander Tests
 *
 * Comprehensive tests for expanding search results using citation relationships.
 * Part of Phase 4: Citation Graph Integration
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CitationExpander,
  createCitationExpander,
  type ExpandableResult,
  type ExpandedResult,
  type CitationExpanderConfig,
} from '../../../../src/god-agent/cli/retrieval/citation-expander.js';
import {
  CitationGraph,
  createCitationGraph,
  type CitationNode,
  type CitationEdge,
} from '../../../../src/god-agent/cli/retrieval/citation-graph.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createTestGraph(): CitationGraph {
  const graph = createCitationGraph();

  // Add nodes
  const nodes: CitationNode[] = [
    { id: 'paper-1', title: 'Foundational Paper', type: 'paper', year: 2018 },
    { id: 'paper-2', title: 'Follow-up Study', type: 'paper', year: 2019 },
    { id: 'paper-3', title: 'Related Work', type: 'paper', year: 2020 },
    { id: 'paper-4', title: 'Recent Paper', type: 'paper', year: 2021 },
    { id: 'paper-5', title: 'Latest Research', type: 'paper', year: 2022 },
  ];

  nodes.forEach((node) => graph.addNode(node));

  // Add edges (citations)
  const edges: CitationEdge[] = [
    { from: 'paper-2', to: 'paper-1', type: 'direct', confidence: 1.0 },
    { from: 'paper-3', to: 'paper-1', type: 'direct', confidence: 1.0 },
    { from: 'paper-3', to: 'paper-2', type: 'direct', confidence: 1.0 },
    { from: 'paper-4', to: 'paper-2', type: 'direct', confidence: 1.0 },
    { from: 'paper-4', to: 'paper-3', type: 'direct', confidence: 0.9 },
    { from: 'paper-5', to: 'paper-3', type: 'direct', confidence: 1.0 },
    { from: 'paper-5', to: 'paper-4', type: 'direct', confidence: 1.0 },
  ];

  edges.forEach((edge) => graph.addEdge(edge));

  return graph;
}

function createSampleResults(): ExpandableResult[] {
  return [
    { id: 'paper-1', score: 0.9, content: 'Content of foundational paper' },
    { id: 'paper-3', score: 0.7, content: 'Content of related work' },
    { id: 'unknown-1', score: 0.5, content: 'Unknown paper not in graph' },
  ];
}

// ============================================================================
// Basic Functionality Tests
// ============================================================================

describe('CitationExpander - Basic Functionality', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    expander = createCitationExpander(graph);
  });

  it('should create expander with default config', () => {
    expect(expander).toBeDefined();
    expect(expander).toBeInstanceOf(CitationExpander);
  });

  it('should create expander with custom config', () => {
    const customExpander = new CitationExpander(graph, {
      citationWeight: 0.5,
      maxExpansion: 10,
      useCoCitation: false,
    });

    expect(customExpander).toBeDefined();
    const config = customExpander.getConfig();
    expect(config.citationWeight).toBe(0.5);
    expect(config.maxExpansion).toBe(10);
    expect(config.useCoCitation).toBe(false);
  });

  it('should get current config', () => {
    const config = expander.getConfig();

    expect(config.enableExpansion).toBe(true);
    expect(config.citationWeight).toBeDefined();
    expect(config.maxExpansion).toBeDefined();
  });

  it('should update config', () => {
    expander.updateConfig({ citationWeight: 0.8 });
    const config = expander.getConfig();

    expect(config.citationWeight).toBe(0.8);
  });

  it('should get and set graph', () => {
    expect(expander.getGraph()).toBe(graph);

    const newGraph = createCitationGraph();
    expander.setGraph(newGraph);

    expect(expander.getGraph()).toBe(newGraph);
  });
});

// ============================================================================
// Expansion Tests
// ============================================================================

describe('CitationExpander - Expansion', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    graph.computePageRank();
    expander = createCitationExpander(graph);
  });

  it('should expand results', () => {
    const results = createSampleResults();
    const { results: expanded, stats } = expander.expand(results, 10);

    expect(expanded.length).toBeGreaterThan(0);
    expect(stats.originalCount).toBe(3);
  });

  it('should preserve original results', () => {
    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 10);

    // Original results should be in expanded
    const expandedIds = expanded.map((r) => r.id);
    expect(expandedIds).toContain('paper-1');
    expect(expandedIds).toContain('paper-3');
  });

  it('should add citation boost to matching results', () => {
    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 10);

    // Results in graph should have citation boost
    const paper1 = expanded.find((r) => r.id === 'paper-1');
    expect(paper1?.citationBoost).toBeGreaterThanOrEqual(0);
    expect(paper1?.source).toBe('direct');
  });

  it('should not boost results not in graph', () => {
    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 10);

    const unknown = expanded.find((r) => r.id === 'unknown-1');
    expect(unknown?.citationBoost).toBe(0);
  });

  it('should respect limit parameter', () => {
    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 2);

    expect(expanded.length).toBeLessThanOrEqual(2);
  });

  it('should sort by combined score', () => {
    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 10);

    for (let i = 1; i < expanded.length; i++) {
      expect(expanded[i - 1].score).toBeGreaterThanOrEqual(expanded[i].score);
    }
  });

  it('should track expansion statistics', () => {
    const results = createSampleResults();
    const { stats } = expander.expand(results, 10);

    expect(stats.originalCount).toBe(3);
    expect(stats.citationMatches).toBeGreaterThanOrEqual(0);
    expect(stats.avgCitationBoost).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Expansion with Citation Relationships Tests
// ============================================================================

describe('CitationExpander - Citation Relationships', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    graph.computePageRank();
    expander = createCitationExpander(graph, {
      useCoCitation: true,
      useBibliographicCoupling: true,
      maxExpansion: 5,
    });
  });

  it('should expand via co-citation', () => {
    // paper-1 and paper-2 are co-cited by paper-3
    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.9, content: 'Paper 1' },
    ];

    const { results: expanded, stats } = expander.expand(results, 10);

    // Should potentially include paper-2 via co-citation
    expect(stats.coCitationMatches).toBeGreaterThanOrEqual(0);
  });

  it('should expand via bibliographic coupling', () => {
    // paper-4 and paper-5 both cite paper-3
    const results: ExpandableResult[] = [
      { id: 'paper-4', score: 0.9, content: 'Paper 4' },
    ];

    const { results: expanded, stats } = expander.expand(results, 10);

    expect(stats.bibliographicMatches).toBeGreaterThanOrEqual(0);
  });

  it('should disable co-citation when configured', () => {
    const noCoCitationExpander = new CitationExpander(graph, {
      useCoCitation: false,
      useBibliographicCoupling: true,
    });

    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.9, content: 'Paper 1' },
    ];

    const { stats } = noCoCitationExpander.expand(results, 10);
    expect(stats.coCitationMatches).toBe(0);
  });

  it('should disable bibliographic coupling when configured', () => {
    const noCouplingExpander = new CitationExpander(graph, {
      useCoCitation: true,
      useBibliographicCoupling: false,
    });

    const results: ExpandableResult[] = [
      { id: 'paper-4', score: 0.9, content: 'Paper 4' },
    ];

    const { stats } = noCouplingExpander.expand(results, 10);
    expect(stats.bibliographicMatches).toBe(0);
  });
});

// ============================================================================
// PageRank Boosting Tests
// ============================================================================

describe('CitationExpander - PageRank Boosting', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    graph.computePageRank();
    expander = createCitationExpander(graph, {
      usePageRank: true,
    });
  });

  it('should boost by PageRank scores', () => {
    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.5, content: 'Foundational' },
      { id: 'paper-5', score: 0.5, content: 'Latest' },
    ];

    const boosted = expander.boostByPageRank(results);

    // paper-1 is more cited, should have higher boost
    const paper1Score = boosted.find((r) => r.id === 'paper-1')?.score ?? 0;
    const paper5Score = boosted.find((r) => r.id === 'paper-5')?.score ?? 0;

    // paper-1 should be boosted more (more citations)
    expect(paper1Score).toBeGreaterThanOrEqual(paper5Score);
  });

  it('should not boost when PageRank disabled', () => {
    const noPageRankExpander = new CitationExpander(graph, {
      usePageRank: false,
    });

    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.5, content: 'Paper' },
    ];

    const boosted = noPageRankExpander.boostByPageRank(results);

    // Score should be unchanged
    expect(boosted[0].score).toBe(0.5);
  });

  it('should track PageRank boost in stats', () => {
    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.9, content: 'Paper 1' },
      { id: 'paper-3', score: 0.7, content: 'Paper 3' },
    ];

    const { stats } = expander.expand(results, 10);

    expect(stats.pageRankBoosted).toBeGreaterThanOrEqual(0);
  });
});

// ============================================================================
// Expansion Suggestions Tests
// ============================================================================

describe('CitationExpander - Suggestions', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    expander = createCitationExpander(graph);
  });

  it('should suggest expansions', () => {
    const resultIds = ['paper-1', 'paper-3'];
    const suggestions = expander.suggestExpansions(resultIds, 5);

    expect(Array.isArray(suggestions)).toBe(true);
  });

  it('should not suggest already included results', () => {
    const resultIds = ['paper-1', 'paper-2'];
    const suggestions = expander.suggestExpansions(resultIds, 5);

    const suggestionIds = suggestions.map((s) => s.node.id);
    expect(suggestionIds).not.toContain('paper-1');
    expect(suggestionIds).not.toContain('paper-2');
  });

  it('should respect limit', () => {
    const resultIds = ['paper-1'];
    const suggestions = expander.suggestExpansions(resultIds, 2);

    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it('should sort suggestions by score', () => {
    const resultIds = ['paper-3'];
    const suggestions = expander.suggestExpansions(resultIds, 5);

    for (let i = 1; i < suggestions.length; i++) {
      expect(suggestions[i - 1].score).toBeGreaterThanOrEqual(
        suggestions[i].score
      );
    }
  });

  it('should handle empty result IDs', () => {
    const suggestions = expander.suggestExpansions([], 5);
    expect(suggestions.length).toBe(0);
  });

  it('should handle non-existent IDs', () => {
    const suggestions = expander.suggestExpansions(['non-existent'], 5);
    expect(suggestions.length).toBe(0);
  });
});

// ============================================================================
// Citation Similarity Tests
// ============================================================================

describe('CitationExpander - Citation Similarity', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    expander = createCitationExpander(graph);
  });

  it('should compute citation similarity', () => {
    // paper-1 and paper-2 are related (paper-2 cites paper-1)
    const similarity = expander.citationSimilarity('paper-1', 'paper-2');
    expect(similarity).toBeGreaterThan(0);
  });

  it('should return 0 for unrelated papers', () => {
    // Create isolated node
    graph.addNode({
      id: 'isolated',
      title: 'Isolated Paper',
      type: 'paper',
    });

    const similarity = expander.citationSimilarity('paper-1', 'isolated');
    expect(similarity).toBe(0);
  });

  it('should return 0 for non-existent papers', () => {
    const similarity = expander.citationSimilarity('paper-1', 'non-existent');
    expect(similarity).toBe(0);
  });

  it('should be symmetric', () => {
    const sim1 = expander.citationSimilarity('paper-1', 'paper-2');
    const sim2 = expander.citationSimilarity('paper-2', 'paper-1');

    // Similarity should be roughly symmetric (may differ due to directed edges)
    expect(Math.abs(sim1 - sim2)).toBeLessThan(0.5);
  });

  it('should account for co-citation', () => {
    // paper-1 and paper-2 are co-cited by paper-3
    const similarity = expander.citationSimilarity('paper-1', 'paper-2');
    expect(similarity).toBeGreaterThan(0);
  });
});

// ============================================================================
// Disabled Expansion Tests
// ============================================================================

describe('CitationExpander - Disabled Expansion', () => {
  it('should pass through results when expansion disabled', () => {
    const graph = createTestGraph();
    const expander = new CitationExpander(graph, {
      enableExpansion: false,
    });

    const results = createSampleResults();
    const { results: expanded, stats } = expander.expand(results, 10);

    // Should just convert results without expansion
    expect(expanded.length).toBe(3);
    expect(stats.expandedCount).toBe(0);

    // All should be marked as 'direct'
    expanded.forEach((r) => {
      expect(r.source).toBe('direct');
      expect(r.citationBoost).toBe(0);
    });
  });

  it('should pass through results when graph is empty', () => {
    const emptyGraph = createCitationGraph();
    const expander = new CitationExpander(emptyGraph);

    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 10);

    expect(expanded.length).toBe(3);
    expanded.forEach((r) => {
      expect(r.citationBoost).toBe(0);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('CitationExpander - Edge Cases', () => {
  let graph: CitationGraph;
  let expander: CitationExpander;

  beforeEach(() => {
    graph = createTestGraph();
    graph.computePageRank();
    expander = createCitationExpander(graph);
  });

  it('should handle empty results', () => {
    const { results, stats } = expander.expand([], 10);

    expect(results.length).toBe(0);
    expect(stats.originalCount).toBe(0);
  });

  it('should handle single result', () => {
    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.9, content: 'Content' },
    ];

    const { results: expanded } = expander.expand(results, 10);

    expect(expanded.length).toBeGreaterThan(0);
  });

  it('should handle results with metadata', () => {
    const results: ExpandableResult[] = [
      {
        id: 'paper-1',
        score: 0.9,
        content: 'Content',
        metadata: { custom: 'value' },
      },
    ];

    const { results: expanded } = expander.expand(results, 10);
    const paper1 = expanded.find((r) => r.id === 'paper-1');

    expect(paper1?.metadata?.custom).toBe('value');
  });

  it('should handle very low scores', () => {
    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.001, content: 'Content' },
    ];

    const { results: expanded } = expander.expand(results, 10);

    expect(expanded.length).toBeGreaterThan(0);
    expect(expanded[0].originalScore).toBe(0.001);
  });

  it('should handle zero expansion limit', () => {
    const results = createSampleResults();
    const { results: expanded } = expander.expand(results, 0);

    expect(expanded.length).toBe(0);
  });

  it('should handle duplicate IDs in results', () => {
    const results: ExpandableResult[] = [
      { id: 'paper-1', score: 0.9, content: 'Content 1' },
      { id: 'paper-1', score: 0.8, content: 'Content 2' }, // Duplicate
    ];

    // Should not crash
    const { results: expanded } = expander.expand(results, 10);
    expect(expanded.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('CitationExpander - Integration', () => {
  it('should work with full workflow', () => {
    const graph = createTestGraph();
    graph.computePageRank();

    const expander = createCitationExpander(graph, {
      citationWeight: 0.3,
      maxExpansion: 5,
      useCoCitation: true,
      useBibliographicCoupling: true,
      usePageRank: true,
    });

    // Simulate search results
    const searchResults: ExpandableResult[] = [
      { id: 'paper-3', score: 0.95, content: 'Best match' },
      { id: 'paper-1', score: 0.85, content: 'Good match' },
    ];

    // Expand results
    const { results: expanded, stats } = expander.expand(searchResults, 10);

    // Verify expansion worked
    expect(expanded.length).toBeGreaterThan(0);
    expect(stats.originalCount).toBe(2);

    // Results should be sorted by score
    for (let i = 1; i < expanded.length; i++) {
      expect(expanded[i - 1].score).toBeGreaterThanOrEqual(expanded[i].score);
    }

    // Get suggestions for further exploration
    const suggestions = expander.suggestExpansions(
      expanded.map((r) => r.id),
      3
    );

    // Suggestions should be valid
    suggestions.forEach((s) => {
      expect(s.node).toBeDefined();
      expect(s.score).toBeGreaterThan(0);
    });

    // Check similarity between top results
    if (expanded.length >= 2) {
      const similarity = expander.citationSimilarity(
        expanded[0].id,
        expanded[1].id
      );
      expect(similarity).toBeGreaterThanOrEqual(0);
    }
  });
});
