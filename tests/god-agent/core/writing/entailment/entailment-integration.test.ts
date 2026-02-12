/**
 * Tests for Typed Entailment Relations - Integration
 *
 * Tests the integration of entailment classification with ClaimProfile
 * and validation rules.
 */

import { describe, it, expect } from 'vitest';
import {
  // Profile integration
  extendWithEntailment,
  isClaimEntailmentProfile,
  getExpectedEntailmentTypes,
  checkEntailmentExpectations,
  getProfileEntailmentMismatches,
  analyzeComposite,
  PROFILE_ENTAILMENT_EXPECTATIONS,
  // Requirements
  ENTAILMENT_REQUIREMENTS,
  meetsThreshold,
  validateAgainstRequirements,
  getAdjustedThreshold,
  // Rules
  createEntailmentValidationRules,
  applyEntailmentRules,
  getMatchingEntailmentRules,
  validateWithEntailmentRules,
  // Types
  createEntailmentRelation,
} from '../../../../../src/god-agent/core/writing/entailment/index.js';
import {
  createDefaultProfile,
  mergeWithDefaults,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  StructureType,
  ModalityType,
  EpistemicForceType,
} from '../../../../../src/god-agent/core/writing/claim-profile.js';

describe('ClaimProfile Integration', () => {
  describe('extendWithEntailment', () => {
    it('should extend a ClaimProfile with entailment', () => {
      const profile = createDefaultProfile();
      const entailment = {
        primary: createEntailmentRelation({
          type: 'textual',
          confidence: 0.85,
        }),
        secondary: [],
        overallStrength: 0.85,
        meetsRequirements: true,
        unmetRequirements: [],
      };

      const extended = extendWithEntailment(profile, entailment);

      expect(isClaimEntailmentProfile(extended)).toBe(true);
      expect(extended.entailment.primary.type).toBe('textual');
      expect(extended.entailment.primary.confidence).toBe(0.85);
    });

    it('should create default entailment when not provided', () => {
      const profile = createDefaultProfile();
      const extended = extendWithEntailment(profile);

      expect(extended.entailment).toBeDefined();
      expect(extended.entailment.primary.type).toBe('textual');
      expect(extended.entailment.primary.confidence).toBe(0);
    });
  });

  describe('Profile-Entailment Expectations', () => {
    it('should have expectations for various profile combinations', () => {
      expect(PROFILE_ENTAILMENT_EXPECTATIONS.length).toBeGreaterThan(10);
    });

    it('should expect textual for direct+explicit attribution', () => {
      const profile = mergeWithDefaults({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.EXPLICIT,
        },
      });

      const { types, strength } = getExpectedEntailmentTypes(profile);

      expect(types).toContain('textual');
      expect(strength).toBe('required');
    });

    it('should expect conceptual for interpretive attribution', () => {
      const profile = mergeWithDefaults({
        attribution: { type: AttributionType.INTERPRETIVE },
      });

      const { types } = getExpectedEntailmentTypes(profile);

      expect(types).toContain('conceptual');
      expect(types).toContain('paraphrastic');
    });

    it('should expect inferential for inferential structure', () => {
      const profile = mergeWithDefaults({
        structure: { type: StructureType.INFERENTIAL },
      });

      const { types, strength } = getExpectedEntailmentTypes(profile);

      expect(types).toContain('inferential');
      expect(strength).toBe('required');
    });

    it('should expect analogical for alignment assertion', () => {
      const profile = mergeWithDefaults({
        assertion: { type: AssertionType.ALIGNMENT },
      });

      const { types, strength } = getExpectedEntailmentTypes(profile);

      expect(types).toContain('analogical');
      expect(strength).toBe('required');
    });

    it('should reduce requirements for speculative modality', () => {
      const profile = mergeWithDefaults({
        modality: { type: ModalityType.SPECULATIVE },
      });

      const { strength } = getExpectedEntailmentTypes(profile);

      expect(strength).toBe('optional');
    });
  });

  describe('checkEntailmentExpectations', () => {
    it('should pass when entailment matches expectations', () => {
      const profile = mergeWithDefaults({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.EXPLICIT,
        },
      });
      const entailment = createEntailmentRelation({
        type: 'textual',
        confidence: 0.9,
      });

      const result = checkEntailmentExpectations(profile, entailment);

      expect(result.met).toBe(true);
      expect(result.typeMatches).toBe(true);
    });

    it('should fail when required type is missing', () => {
      const profile = mergeWithDefaults({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.EXPLICIT,
        },
      });
      const entailment = createEntailmentRelation({
        type: 'evaluative', // Wrong type for direct+explicit
        confidence: 0.9,
      });

      const result = checkEntailmentExpectations(profile, entailment);

      expect(result.met).toBe(false);
      expect(result.typeMatches).toBe(false);
      expect(result.unmetStrength).toBe('required');
    });

    it('should warn but pass for recommended type mismatch', () => {
      const profile = mergeWithDefaults({
        attribution: { type: AttributionType.INTERPRETIVE },
      });
      const entailment = createEntailmentRelation({
        type: 'evaluative', // Not recommended for interpretive
        confidence: 0.9,
      });

      const result = checkEntailmentExpectations(profile, entailment);

      // Recommended, not required, so should still pass
      expect(result.met).toBe(true);
      expect(result.unmetStrength).toBe('recommended');
    });
  });

  describe('getProfileEntailmentMismatches', () => {
    it('should detect explicit attribution with non-textual entailment', () => {
      const profile = mergeWithDefaults({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.EXPLICIT,
        },
      });
      const entailment = createEntailmentRelation({
        type: 'conceptual',
        confidence: 0.8,
      });

      const mismatches = getProfileEntailmentMismatches(profile, entailment);

      expect(mismatches).toContain(
        'EXPLICIT_ATTRIBUTION_REQUIRES_TEXTUAL: Explicit direct attribution should have textual entailment'
      );
    });

    it('should detect alignment without analogical entailment', () => {
      const profile = mergeWithDefaults({
        assertion: { type: AssertionType.ALIGNMENT },
      });
      const entailment = createEntailmentRelation({
        type: 'textual',
        confidence: 0.9,
      });

      const mismatches = getProfileEntailmentMismatches(profile, entailment);

      expect(mismatches.some((m) => m.includes('ALIGNMENT_REQUIRES_ANALOGICAL'))).toBe(true);
    });

    it('should detect evaluative force with textual entailment', () => {
      const profile = mergeWithDefaults({
        epistemicForce: { type: EpistemicForceType.EVALUATIVE },
      });
      const entailment = createEntailmentRelation({
        type: 'textual',
        confidence: 0.9,
      });

      const mismatches = getProfileEntailmentMismatches(profile, entailment);

      expect(mismatches.some((m) => m.includes('EVALUATIVE_NOT_TEXTUAL'))).toBe(true);
    });
  });

  describe('analyzeComposite', () => {
    it('should produce composite analysis', () => {
      const profile = createDefaultProfile();
      const entailment = createEntailmentRelation({
        type: 'textual',
        confidence: 0.8,
      });

      const analysis = analyzeComposite(profile, entailment);

      expect(analysis.profile).toBeDefined();
      expect(analysis.expectationCheck).toBeDefined();
      expect(analysis.riskLevel).toBeDefined();
      expect(analysis.validityScore).toBeGreaterThanOrEqual(0);
      expect(analysis.validityScore).toBeLessThanOrEqual(1);
    });

    it('should calculate higher risk for mismatches', () => {
      const profile = mergeWithDefaults({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.EXPLICIT,
        },
      });
      const entailment = createEntailmentRelation({
        type: 'evaluative', // Mismatch
        confidence: 0.5,
      });

      const analysis = analyzeComposite(profile, entailment);

      expect(['medium', 'high', 'critical']).toContain(analysis.riskLevel);
      expect(analysis.mismatches.length).toBeGreaterThan(0);
    });

    it('should generate suggestions for mismatches', () => {
      const profile = mergeWithDefaults({
        structure: { type: StructureType.INFERENTIAL },
      });
      const entailment = createEntailmentRelation({
        type: 'textual', // Should be inferential
        confidence: 0.7,
      });

      const analysis = analyzeComposite(profile, entailment);

      expect(analysis.suggestions.length).toBeGreaterThan(0);
    });
  });
});

describe('Entailment Requirements', () => {
  describe('ENTAILMENT_REQUIREMENTS', () => {
    it('should have requirements for all 6 types', () => {
      const types = ['textual', 'paraphrastic', 'conceptual', 'inferential', 'analogical', 'evaluative'];
      for (const type of types) {
        expect(ENTAILMENT_REQUIREMENTS[type as keyof typeof ENTAILMENT_REQUIREMENTS]).toBeDefined();
      }
    });

    it('should have highest threshold for textual', () => {
      expect(ENTAILMENT_REQUIREMENTS.textual.primaryThreshold).toBe(0.85);
    });

    it('should require multi-source for analogical', () => {
      expect(ENTAILMENT_REQUIREMENTS.analogical.evidenceRequirements.minSources).toBe(2);
    });

    it('should require scholarly support for analogical', () => {
      expect(ENTAILMENT_REQUIREMENTS.analogical.evidenceRequirements.scholarlySupport).toBe(
        'required'
      );
    });
  });

  describe('meetsThreshold', () => {
    it('should check if confidence meets threshold', () => {
      expect(meetsThreshold('textual', 0.9)).toBe(true);
      expect(meetsThreshold('textual', 0.7)).toBe(false);
      expect(meetsThreshold('conceptual', 0.65)).toBe(true);
      expect(meetsThreshold('conceptual', 0.5)).toBe(false);
    });
  });

  describe('validateAgainstRequirements', () => {
    it('should validate passing relation', () => {
      const relation = {
        type: 'textual' as const,
        confidence: 0.9,
        evidence: {
          markers: [{ type: 'lexical' as const, strength: 0.85 }],
          sourceMetadata: { page: 42 },
        },
      };

      const result = validateAgainstRequirements(relation, 1, false, true);

      expect(result.primaryThresholdMet).toBe(true);
    });

    it('should fail for missing page number in textual', () => {
      const relation = {
        type: 'textual' as const,
        confidence: 0.9,
        evidence: {
          markers: [{ type: 'lexical' as const, strength: 0.85 }],
          sourceMetadata: {}, // No page
        },
      };

      const result = validateAgainstRequirements(relation, 1, false, true);

      expect(result.rulesFailed).toContain('PAGE_NUMBER_REQUIRED');
    });

    it('should fail for insufficient sources in analogical', () => {
      const relation = {
        type: 'analogical' as const,
        confidence: 0.6,
        evidence: {
          markers: [{ type: 'rhetorical' as const, strength: 0.7 }],
          sourceMetadata: {},
        },
      };

      const result = validateAgainstRequirements(relation, 1); // Only 1 source

      expect(result.rulesFailed).toContain('INSUFFICIENT_SOURCES');
    });
  });

  describe('getAdjustedThreshold', () => {
    it('should return base threshold without adjustment', () => {
      const threshold = getAdjustedThreshold('textual');
      expect(threshold).toBe(0.85);
    });

    it('should reduce threshold for speculative context', () => {
      const threshold = getAdjustedThreshold('textual', 'speculative');
      expect(threshold).toBeLessThan(0.85);
    });

    it('should increase threshold for explicit attribution', () => {
      const threshold = getAdjustedThreshold('textual', 'explicitAttribution');
      expect(threshold).toBeGreaterThan(0.85);
    });
  });
});

describe('Entailment Validation Rules', () => {
  describe('createEntailmentValidationRules', () => {
    it('should create rules for all categories', () => {
      const rules = createEntailmentValidationRules();

      const categories = new Set(rules.map((r) => r.category));
      expect(categories.has('textual')).toBe(true);
      expect(categories.has('paraphrastic')).toBe(true);
      expect(categories.has('conceptual')).toBe(true);
      expect(categories.has('inferential')).toBe(true);
      expect(categories.has('analogical')).toBe(true);
      expect(categories.has('evaluative')).toBe(true);
      expect(categories.has('composite')).toBe(true);
    });

    it('should have unique rule IDs', () => {
      const rules = createEntailmentValidationRules();
      const ids = rules.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getMatchingEntailmentRules', () => {
    it('should match textual entailment rules', () => {
      const profile = extendWithEntailment(createDefaultProfile(), {
        primary: createEntailmentRelation({ type: 'textual', confidence: 0.9 }),
        secondary: [],
        overallStrength: 0.9,
        meetsRequirements: true,
        unmetRequirements: [],
      });

      const matchingRules = getMatchingEntailmentRules(profile);

      expect(matchingRules.some((r) => r.id.includes('TEXTUAL'))).toBe(true);
    });

    it('should match composite rules', () => {
      const profile = extendWithEntailment(
        mergeWithDefaults({
          attribution: {
            type: AttributionType.DIRECT,
            qualifier: AttributionQualifier.EXPLICIT,
          },
        }),
        {
          primary: createEntailmentRelation({ type: 'textual', confidence: 0.9 }),
          secondary: [],
          overallStrength: 0.9,
          meetsRequirements: true,
          unmetRequirements: [],
        }
      );

      const matchingRules = getMatchingEntailmentRules(profile);

      expect(matchingRules.some((r) => r.id === 'COMPOSITE_DIRECT_TEXTUAL_EXPLICIT')).toBe(true);
    });
  });

  describe('applyEntailmentRules', () => {
    it('should apply rules and modify requirements', () => {
      const profile = extendWithEntailment(createDefaultProfile(), {
        primary: createEntailmentRelation({ type: 'textual', confidence: 0.9 }),
        secondary: [],
        overallStrength: 0.9,
        meetsRequirements: true,
        unmetRequirements: [],
      });

      const baseRequirements = {
        citationRequired: 'optional' as const,
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional' as const,
        argumentStructureRequired: false,
        riskLevel: 'low' as const,
        applicableRules: [] as string[],
        minSourceCount: 1,
      };

      const result = applyEntailmentRules(profile, baseRequirements);

      expect(result.exactGroundingRequired).toBe(true);
      expect(result.citationRequired).toBe('mandatory');
      expect(result.applicableRules).toContain('ENTAIL_TEXTUAL_EXACT_QUOTE');
    });

    it('should reduce requirements for speculative inferential', () => {
      const profile = extendWithEntailment(
        mergeWithDefaults({
          modality: { type: ModalityType.SPECULATIVE },
        }),
        {
          primary: createEntailmentRelation({ type: 'inferential', confidence: 0.7 }),
          secondary: [],
          overallStrength: 0.7,
          meetsRequirements: true,
          unmetRequirements: [],
        }
      );

      const baseRequirements = {
        citationRequired: 'mandatory' as const,
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional' as const,
        argumentStructureRequired: false,
        riskLevel: 'low' as const,
        applicableRules: [] as string[],
        minSourceCount: 1,
      };

      const result = applyEntailmentRules(profile, baseRequirements);

      expect(result.citationRequired).toBe('recommended');
    });
  });

  describe('validateWithEntailmentRules', () => {
    it('should validate and return results', () => {
      const profile = extendWithEntailment(createDefaultProfile(), {
        primary: createEntailmentRelation({ type: 'textual', confidence: 0.9 }),
        secondary: [],
        overallStrength: 0.9,
        meetsRequirements: true,
        unmetRequirements: [],
      });

      const result = validateWithEntailmentRules(profile);

      expect(result.appliedRules.length).toBeGreaterThan(0);
      expect(result.requirements).toBeDefined();
    });

    it('should generate warnings for mismatches', () => {
      const profile = extendWithEntailment(
        mergeWithDefaults({
          assertion: { type: AssertionType.ALIGNMENT },
        }),
        {
          primary: createEntailmentRelation({ type: 'textual', confidence: 0.9 }),
          secondary: [],
          overallStrength: 0.9,
          meetsRequirements: true,
          unmetRequirements: [],
        }
      );

      const result = validateWithEntailmentRules(profile);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.passed).toBe(false);
    });
  });
});
