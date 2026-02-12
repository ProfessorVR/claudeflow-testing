/**
 * Tests for Multi-Axis Claim Profile Types
 */

import { describe, it, expect } from 'vitest';
import {
  createDefaultProfile,
  mergeWithDefaults,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  StructureType,
  ModalityType,
  EpistemicForceType,
  type ClaimProfile,
  type PartialClaimProfile,
} from '../../../../src/god-agent/core/writing/claim-profile.js';

describe('ClaimProfile Types', () => {
  describe('createDefaultProfile', () => {
    it('should create a valid default profile', () => {
      const profile = createDefaultProfile();

      expect(profile.attribution.type).toBe(AttributionType.NONE);
      expect(profile.attribution.inherited).toBe(false);
      expect(profile.assertion.type).toBe(AssertionType.FACTUAL);
      expect(profile.assertion.secondary).toEqual([]);
      expect(profile.structure.type).toBe(StructureType.ATOMIC);
      expect(profile.structure.atomicClaimCount).toBe(1);
      expect(profile.modality.type).toBe(ModalityType.ASSERTED);
      expect(profile.modality.commitmentLevel).toBe(1);
      expect(profile.epistemicForce.type).toBe(EpistemicForceType.DESCRIPTIVE);
      expect(profile.epistemicForce.normativeStrength).toBe(0);
    });

    it('should have confidence scores of 0.5 for all axes', () => {
      const profile = createDefaultProfile();

      expect(profile.confidence.attribution).toBe(0.5);
      expect(profile.confidence.assertion).toBe(0.5);
      expect(profile.confidence.structure).toBe(0.5);
      expect(profile.confidence.modality).toBe(0.5);
      expect(profile.confidence.epistemicForce).toBe(0.5);
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge partial profile with defaults', () => {
      const partial: PartialClaimProfile = {
        attribution: {
          type: AttributionType.DIRECT,
          authors: ['Aristotle'],
        },
      };

      const merged = mergeWithDefaults(partial);

      expect(merged.attribution.type).toBe(AttributionType.DIRECT);
      expect(merged.attribution.authors).toEqual(['Aristotle']);
      // Other axes should be defaults
      expect(merged.assertion.type).toBe(AssertionType.FACTUAL);
      expect(merged.structure.type).toBe(StructureType.ATOMIC);
    });

    it('should merge multiple partial axes', () => {
      const partial: PartialClaimProfile = {
        attribution: { type: AttributionType.CONSENSUS },
        assertion: { type: AssertionType.DEFINITIONAL },
        modality: { type: ModalityType.SPECULATIVE, commitmentLevel: 0.5 },
      };

      const merged = mergeWithDefaults(partial);

      expect(merged.attribution.type).toBe(AttributionType.CONSENSUS);
      expect(merged.assertion.type).toBe(AssertionType.DEFINITIONAL);
      expect(merged.modality.type).toBe(ModalityType.SPECULATIVE);
      expect(merged.modality.commitmentLevel).toBe(0.5);
      // Unspecified axes use defaults
      expect(merged.structure.type).toBe(StructureType.ATOMIC);
      expect(merged.epistemicForce.type).toBe(EpistemicForceType.DESCRIPTIVE);
    });

    it('should preserve arrays in partial profiles', () => {
      const partial: PartialClaimProfile = {
        assertion: {
          type: AssertionType.COMPARATIVE,
          secondary: [AssertionType.EVALUATIVE],
          terms: ['phantasia', 'Stimmung'],
        },
      };

      const merged = mergeWithDefaults(partial);

      expect(merged.assertion.secondary).toEqual([AssertionType.EVALUATIVE]);
      expect(merged.assertion.terms).toEqual(['phantasia', 'Stimmung']);
    });

    it('should handle empty partial profile', () => {
      const merged = mergeWithDefaults({});
      const defaults = createDefaultProfile();

      expect(merged.attribution.type).toBe(defaults.attribution.type);
      expect(merged.assertion.type).toBe(defaults.assertion.type);
      expect(merged.structure.type).toBe(defaults.structure.type);
      expect(merged.modality.type).toBe(defaults.modality.type);
      expect(merged.epistemicForce.type).toBe(defaults.epistemicForce.type);
    });
  });

  describe('Enum Values', () => {
    it('should have all attribution types', () => {
      expect(AttributionType.DIRECT).toBe('direct');
      expect(AttributionType.INTERPRETIVE).toBe('interpretive');
      expect(AttributionType.CONSENSUS).toBe('consensus');
      expect(AttributionType.DISPUTED).toBe('disputed');
      expect(AttributionType.PROXY).toBe('proxy');
      expect(AttributionType.ANONYMOUS).toBe('anonymous');
      expect(AttributionType.AUTHORIAL).toBe('authorial');
      expect(AttributionType.INHERITED).toBe('inherited');
      expect(AttributionType.NONE).toBe('none');
    });

    it('should have all assertion types', () => {
      expect(AssertionType.DEFINITIONAL).toBe('definitional');
      expect(AssertionType.FUNCTIONAL).toBe('functional');
      expect(AssertionType.MODAL).toBe('modal');
      expect(AssertionType.DEPENDENCY).toBe('dependency');
      expect(AssertionType.COMPARATIVE).toBe('comparative');
      expect(AssertionType.EVALUATIVE).toBe('evaluative');
      expect(AssertionType.NOVELTY).toBe('novelty');
      expect(AssertionType.SCOPE).toBe('scope');
    });

    it('should have all structure types', () => {
      expect(StructureType.ATOMIC).toBe('atomic');
      expect(StructureType.CONJUNCTIVE).toBe('conjunctive');
      expect(StructureType.DISJUNCTIVE).toBe('disjunctive');
      expect(StructureType.CONDITIONAL).toBe('conditional');
      expect(StructureType.INFERENTIAL).toBe('inferential');
      expect(StructureType.EXPLANATORY).toBe('explanatory');
    });

    it('should have all modality types', () => {
      expect(ModalityType.ASSERTED).toBe('asserted');
      expect(ModalityType.INTERPRETED).toBe('interpreted');
      expect(ModalityType.SPECULATIVE).toBe('speculative');
      expect(ModalityType.HYPOTHETICAL).toBe('hypothetical');
      expect(ModalityType.NEGATED).toBe('negated');
    });

    it('should have all epistemic force types', () => {
      expect(EpistemicForceType.DESCRIPTIVE).toBe('descriptive');
      expect(EpistemicForceType.EVALUATIVE).toBe('evaluative');
      expect(EpistemicForceType.NORMATIVE).toBe('normative');
      expect(EpistemicForceType.EXPLANATORY).toBe('explanatory');
      expect(EpistemicForceType.CRITICAL).toBe('critical');
    });
  });
});
