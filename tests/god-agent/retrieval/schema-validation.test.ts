/**
 * Regression tests for JSONL schema validation (Phase 1 fixes).
 *
 * Validates:
 *   C-04: KU confidence string→number normalization
 *   C-05: KU sources schema matches actual JSONL
 *   C-06: Shared ReasoningEdge/KnowledgeUnit types via Zod
 *   H-07: Confidence normalization in all loaders
 */

import { describe, it, expect } from 'vitest';
import { parseKnowledgeUnit, parseReasoningEdge } from '../../../src/god-agent/retrieval/types.js';

// ── C-04: Confidence string→number normalization ───────────────────────────

describe('C-04: KU confidence normalization', () => {
  it('normalizes "high" to 0.9', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_01', claim: 'Test claim', confidence: 'high',
    }));
    expect(ku).not.toBeNull();
    expect(ku!.confidence).toBe(0.9);
  });

  it('normalizes "medium" to 0.6', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_02', claim: 'Test claim', confidence: 'medium',
    }));
    expect(ku!.confidence).toBe(0.6);
  });

  it('normalizes "low" to 0.3', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_03', claim: 'Test claim', confidence: 'low',
    }));
    expect(ku!.confidence).toBe(0.3);
  });

  it('passes through numeric confidence unchanged', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_04', claim: 'Test claim', confidence: 0.75,
    }));
    expect(ku!.confidence).toBe(0.75);
  });

  it('defaults unknown string confidence to 0.5', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_05', claim: 'Test claim', confidence: 'unknown_tier',
    }));
    expect(ku!.confidence).toBe(0.5);
  });
});

// ── C-05: KU sources schema matches actual JSONL ───────────────────────────

describe('C-05: KU sources schema', () => {
  it('accepts pages as string (actual data format)', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_src_01',
      claim: 'Test claim',
      confidence: 'high',
      sources: [{
        author: 'Aristotle',
        title: 'Metaphysics',
        path_rel: 'metaphysics/Aristotle - Metaphysics.pdf',
        pages: '356-358',
        chunk_id: 'abc123',
        has_bboxes: true,
        source_method: 'marker+bbox',
        bboxes: '[{"page_num": 356}]',
      }],
    }));
    expect(ku).not.toBeNull();
    expect(ku!.sources[0].pages).toBe('356-358');
    expect(ku!.sources[0].has_bboxes).toBe(true);
    expect(ku!.sources[0].source_method).toBe('marker+bbox');
  });

  it('accepts pages as number[] (legacy format)', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_src_02',
      claim: 'Test claim',
      confidence: 'medium',
      sources: [{ author: 'Test', pages: [1, 2, 3] }],
    }));
    expect(ku).not.toBeNull();
    expect(ku!.sources[0].pages).toEqual([1, 2, 3]);
  });

  it('accepts null chunk_id', () => {
    const ku = parseKnowledgeUnit(JSON.stringify({
      id: 'ku_test_src_03',
      claim: 'Test claim',
      confidence: 'low',
      sources: [{ author: 'Test', chunk_id: null }],
    }));
    expect(ku).not.toBeNull();
    expect(ku!.sources[0].chunk_id).toBeNull();
  });
});

// ── C-06: Shared ReasoningEdge type ────────────────────────────────────────

describe('C-06: ReasoningEdge validation', () => {
  it('parses a complete edge', () => {
    const edge = parseReasoningEdge(JSON.stringify({
      id: 'edge_test_01',
      source: 'kinesis',
      relation: 'presupposes',
      target: 'chronos',
      domain: 'temporal',
      confidence: 'high',
      pipeline: 'phantasia',
      knowledge_ids: ['ku_01', 'ku_02'],
      corroboration_score: 1.5,
      generation_epoch: 0,
      derivation: 'manual',
    }));
    expect(edge).not.toBeNull();
    expect(edge!.source).toBe('kinesis');
    expect(edge!.confidence).toBe(0.9); // normalized from "high"
    expect(edge!.knowledge_ids).toEqual(['ku_01', 'ku_02']);
  });

  it('rejects edge missing required source', () => {
    const edge = parseReasoningEdge(JSON.stringify({
      id: 'edge_test_02',
      relation: 'supports',
      target: 'something',
    }));
    expect(edge).toBeNull();
  });

  it('rejects edge missing required relation', () => {
    const edge = parseReasoningEdge(JSON.stringify({
      id: 'edge_test_03',
      source: 'a',
      target: 'b',
    }));
    expect(edge).toBeNull();
  });

  it('preserves extra fields via passthrough', () => {
    const edge = parseReasoningEdge(JSON.stringify({
      id: 'edge_test_04',
      source: 'a',
      relation: 'supports',
      target: 'b',
      custom_field: 'preserved',
    }));
    expect(edge).not.toBeNull();
    expect((edge as any).custom_field).toBe('preserved');
  });
});

// ── H-07: Confidence normalization for edges ───────────────────────────────

describe('H-07: Edge confidence normalization', () => {
  it('normalizes string confidence on edges', () => {
    const edge = parseReasoningEdge(JSON.stringify({
      id: 'edge_conf_01',
      source: 'a',
      relation: 'supports',
      target: 'b',
      confidence: 'medium',
    }));
    expect(edge!.confidence).toBe(0.6);
  });

  it('passes through numeric confidence on edges', () => {
    const edge = parseReasoningEdge(JSON.stringify({
      id: 'edge_conf_02',
      source: 'a',
      relation: 'supports',
      target: 'b',
      confidence: 0.85,
    }));
    expect(edge!.confidence).toBe(0.85);
  });
});
