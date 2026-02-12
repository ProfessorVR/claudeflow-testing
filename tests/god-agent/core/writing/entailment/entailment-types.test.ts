/**
 * Tests for Typed Entailment Relations - Core Types
 */

import { describe, it, expect } from 'vitest';
import {
  // Type guards
  isEntailmentRelationType,
  isEntailmentRelation,
  isEntailmentEvidence,
  isSourceMetadata,
  // Factory functions
  createDefaultEntailmentRelation,
  createEntailmentRelation,
  createDefaultEntailmentProfile,
  createEntailmentMarker,
  // Constants
  PRIMARY_METRICS,
  EntailmentRelationTypeEnum,
} from '../../../../../src/god-agent/core/writing/entailment/entailment-types.js';

describe('Entailment Types', () => {
  describe('EntailmentRelationTypeEnum', () => {
    it('should have all 6 entailment types', () => {
      expect(EntailmentRelationTypeEnum.TEXTUAL).toBe('textual');
      expect(EntailmentRelationTypeEnum.PARAPHRASTIC).toBe('paraphrastic');
      expect(EntailmentRelationTypeEnum.CONCEPTUAL).toBe('conceptual');
      expect(EntailmentRelationTypeEnum.INFERENTIAL).toBe('inferential');
      expect(EntailmentRelationTypeEnum.ANALOGICAL).toBe('analogical');
      expect(EntailmentRelationTypeEnum.EVALUATIVE).toBe('evaluative');
    });
  });

  describe('PRIMARY_METRICS', () => {
    it('should map each type to its primary metric', () => {
      expect(PRIMARY_METRICS.textual).toBe('lexicalOverlap');
      expect(PRIMARY_METRICS.paraphrastic).toBe('semanticSimilarity');
      expect(PRIMARY_METRICS.conceptual).toBe('termAlignment');
      expect(PRIMARY_METRICS.inferential).toBe('premiseCoverage');
      expect(PRIMARY_METRICS.analogical).toBe('bridgeExplicitness');
      expect(PRIMARY_METRICS.evaluative).toBe('argumentPresence');
    });
  });
});

describe('Type Guards', () => {
  describe('isEntailmentRelationType', () => {
    it('should return true for valid types', () => {
      expect(isEntailmentRelationType('textual')).toBe(true);
      expect(isEntailmentRelationType('paraphrastic')).toBe(true);
      expect(isEntailmentRelationType('conceptual')).toBe(true);
      expect(isEntailmentRelationType('inferential')).toBe(true);
      expect(isEntailmentRelationType('analogical')).toBe(true);
      expect(isEntailmentRelationType('evaluative')).toBe(true);
    });

    it('should return false for invalid types', () => {
      expect(isEntailmentRelationType('unknown')).toBe(false);
      expect(isEntailmentRelationType('')).toBe(false);
      expect(isEntailmentRelationType(null)).toBe(false);
      expect(isEntailmentRelationType(undefined)).toBe(false);
      expect(isEntailmentRelationType(123)).toBe(false);
    });
  });

  describe('isSourceMetadata', () => {
    it('should return true for valid metadata', () => {
      expect(isSourceMetadata({ author: 'Aristotle' })).toBe(true);
      expect(
        isSourceMetadata({
          author: 'Heidegger',
          work: 'Being and Time',
          year: 1927,
          page: 134,
        })
      ).toBe(true);
    });

    it('should return false for invalid metadata', () => {
      expect(isSourceMetadata({})).toBe(false);
      expect(isSourceMetadata({ work: 'Some Work' })).toBe(false);
      expect(isSourceMetadata(null)).toBe(false);
      expect(isSourceMetadata('string')).toBe(false);
    });
  });

  describe('isEntailmentEvidence', () => {
    it('should return true for valid evidence', () => {
      const evidence = {
        sourceText: 'Some text',
        sourceMetadata: { author: 'Aristotle' },
        markers: [],
        metrics: {},
      };
      expect(isEntailmentEvidence(evidence)).toBe(true);
    });

    it('should return false for invalid evidence', () => {
      expect(isEntailmentEvidence({})).toBe(false);
      expect(
        isEntailmentEvidence({
          sourceText: 'text',
          sourceMetadata: {},
          markers: [],
          metrics: {},
        })
      ).toBe(false);
    });
  });

  describe('isEntailmentRelation', () => {
    it('should return true for valid relation', () => {
      const relation = {
        type: 'textual',
        confidence: 0.85,
        evidence: {
          sourceText: 'Some text',
          sourceMetadata: { author: 'Aristotle' },
          markers: [],
          metrics: {},
        },
      };
      expect(isEntailmentRelation(relation)).toBe(true);
    });

    it('should return false for invalid confidence', () => {
      const relation = {
        type: 'textual',
        confidence: 1.5, // Invalid: > 1
        evidence: {
          sourceText: 'text',
          sourceMetadata: { author: 'Test' },
          markers: [],
          metrics: {},
        },
      };
      expect(isEntailmentRelation(relation)).toBe(false);
    });

    it('should return false for invalid type', () => {
      const relation = {
        type: 'unknown',
        confidence: 0.5,
        evidence: {
          sourceText: 'text',
          sourceMetadata: { author: 'Test' },
          markers: [],
          metrics: {},
        },
      };
      expect(isEntailmentRelation(relation)).toBe(false);
    });
  });
});

describe('Factory Functions', () => {
  describe('createDefaultEntailmentRelation', () => {
    it('should create a default textual relation', () => {
      const relation = createDefaultEntailmentRelation();
      expect(relation.type).toBe('textual');
      expect(relation.confidence).toBe(0);
      expect(relation.evidence.sourceText).toBe('');
      expect(relation.evidence.sourceMetadata.author).toBe('unknown');
      expect(relation.evidence.markers).toEqual([]);
      expect(relation.evidence.metrics).toEqual({});
    });

    it('should create a relation with specified type', () => {
      const relation = createDefaultEntailmentRelation('inferential');
      expect(relation.type).toBe('inferential');
    });
  });

  describe('createEntailmentRelation', () => {
    it('should merge partial data with defaults', () => {
      const relation = createEntailmentRelation({
        type: 'conceptual',
        confidence: 0.75,
      });

      expect(relation.type).toBe('conceptual');
      expect(relation.confidence).toBe(0.75);
      expect(relation.evidence.sourceMetadata.author).toBe('unknown');
    });

    it('should preserve provided evidence data', () => {
      const relation = createEntailmentRelation({
        type: 'analogical',
        confidence: 0.6,
        evidence: {
          sourceText: 'Custom text',
          sourceMetadata: { author: 'Heidegger', work: 'Being and Time' },
          markers: [{ type: 'rhetorical', value: 'just as', strength: 0.8 }],
          metrics: { bridgeExplicitness: 0.7 },
        },
      });

      expect(relation.evidence.sourceText).toBe('Custom text');
      expect(relation.evidence.sourceMetadata.author).toBe('Heidegger');
      expect(relation.evidence.sourceMetadata.work).toBe('Being and Time');
      expect(relation.evidence.markers).toHaveLength(1);
      expect(relation.evidence.metrics.bridgeExplicitness).toBe(0.7);
    });
  });

  describe('createDefaultEntailmentProfile', () => {
    it('should create a default profile', () => {
      const profile = createDefaultEntailmentProfile();

      expect(profile.primary.type).toBe('textual');
      expect(profile.primary.confidence).toBe(0);
      expect(profile.secondary).toEqual([]);
      expect(profile.overallStrength).toBe(0);
      expect(profile.meetsRequirements).toBe(false);
      expect(profile.unmetRequirements).toEqual([]);
    });
  });

  describe('createEntailmentMarker', () => {
    it('should create a marker with specified values', () => {
      const marker = createEntailmentMarker('lexical', 'quotation', 0.9);

      expect(marker.type).toBe('lexical');
      expect(marker.value).toBe('quotation');
      expect(marker.strength).toBe(0.9);
    });

    it('should clamp strength to valid range', () => {
      const marker1 = createEntailmentMarker('logical', 'test', 1.5);
      expect(marker1.strength).toBe(1);

      const marker2 = createEntailmentMarker('logical', 'test', -0.5);
      expect(marker2.strength).toBe(0);
    });

    it('should include positions when provided', () => {
      const marker = createEntailmentMarker('semantic', 'term', 0.7, {
        claim: { start: 0, end: 10 },
        evidence: { start: 20, end: 30 },
      });

      expect(marker.claimPosition).toEqual({ start: 0, end: 10 });
      expect(marker.evidencePosition).toEqual({ start: 20, end: 30 });
    });
  });
});
