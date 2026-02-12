/**
 * Tests for Compositional Validation Rule Engine
 */

import { describe, it, expect } from 'vitest';
import {
  ValidationRuleEngine,
  computeRiskLevel,
  generateSuggestions,
} from '../../../../src/god-agent/core/writing/validation-rule-engine.js';
import {
  type ClaimProfile,
  AttributionType,
  AttributionQualifier,
  AssertionType,
  StructureType,
  LogicalConnective,
  ModalityType,
  HedgeMarker,
  EpistemicForceType,
  InferenceType,
  mergeWithDefaults,
} from '../../../../src/god-agent/core/writing/claim-profile.js';

describe('ValidationRuleEngine', () => {
  const engine = new ValidationRuleEngine();

  // Helper to create test profiles
  const createProfile = (
    overrides: Partial<{
      attribution: Partial<ClaimProfile['attribution']>;
      assertion: Partial<ClaimProfile['assertion']>;
      structure: Partial<ClaimProfile['structure']>;
      modality: Partial<ClaimProfile['modality']>;
      epistemicForce: Partial<ClaimProfile['epistemicForce']>;
    }>
  ): ClaimProfile =>
    mergeWithDefaults({
      attribution: overrides.attribution,
      assertion: overrides.assertion,
      structure: overrides.structure,
      modality: overrides.modality,
      epistemicForce: overrides.epistemicForce,
    });

  describe('Attribution-Based Rules', () => {
    it('should require citation for direct attribution', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.DIRECT, authors: ['Aristotle'] },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.citationRequired).toBe('mandatory');
      expect(requirements.applicableRules).toContain('ATTR_DIRECT_CITATION');
    });

    it('should require exact grounding for explicit attribution', () => {
      const profile = createProfile({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.EXPLICIT,
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.exactGroundingRequired).toBe(true);
      expect(requirements.applicableRules).toContain('ATTR_EXPLICIT_GROUNDING');
    });

    it('should require argument structure for demonstrative attribution', () => {
      const profile = createProfile({
        attribution: {
          type: AttributionType.DIRECT,
          qualifier: AttributionQualifier.DEMONSTRATIVE,
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.applicableRules).toContain('ATTR_DEMONSTRATIVE_ARGUMENT');
    });

    it('should require justification for interpretive attribution', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.INTERPRETIVE },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.citationRequired).toBe('recommended');
      expect(requirements.applicableRules).toContain('ATTR_INTERPRETIVE_JUSTIFICATION');
    });

    it('should require multiple sources for scholarly consensus', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.CONSENSUS },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.multiSourceRequired).toBe(true);
      expect(requirements.minSourceCount).toBeGreaterThanOrEqual(3);
      expect(requirements.applicableRules).toContain('ATTR_CONSENSUS_MULTISOURCE');
    });

    it('should require paired sources for scholarly dispute', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.DISPUTED },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.multiSourceRequired).toBe(true);
      expect(requirements.minSourceCount).toBeGreaterThanOrEqual(2);
      expect(requirements.applicableRules).toContain('ATTR_DISPUTED_PAIRED');
    });

    it('should flag anonymous authority as requiring resolution', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.ANONYMOUS },
      });

      const requirements = engine.computeRequirements(profile);

      // Anonymous authority is highest priority and requires multiple sources
      expect(requirements.citationRequired).toBe('mandatory');
      expect(requirements.multiSourceRequired).toBe(true);
      expect(requirements.minSourceCount).toBeGreaterThanOrEqual(3);
      expect(requirements.applicableRules).toContain('ATTR_ANONYMOUS_INVALID');
    });

    it('should have minimal requirements for authorial claims', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.AUTHORIAL },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.citationRequired).toBe('optional');
      expect(requirements.applicableRules).toContain('ATTR_AUTHORIAL_MINIMAL');
    });
  });

  describe('Assertion-Based Rules', () => {
    it('should require exact grounding for definitional claims', () => {
      const profile = createProfile({
        assertion: { type: AssertionType.DEFINITIONAL },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.exactGroundingRequired).toBe(true);
      expect(requirements.citationRequired).toBe('mandatory');
      expect(requirements.applicableRules).toContain('ASSERT_DEFINITIONAL_EXACT');
    });

    it('should require strict verification for modal claims', () => {
      const profile = createProfile({
        assertion: { type: AssertionType.MODAL },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.exactGroundingRequired).toBe(true);
      expect(requirements.citationRequired).toBe('mandatory');
      expect(requirements.applicableRules).toContain('ASSERT_MODAL_STRICT');
    });

    it('should require strict verification for dependency claims', () => {
      const profile = createProfile({
        assertion: { type: AssertionType.DEPENDENCY },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.exactGroundingRequired).toBe(true);
      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.applicableRules).toContain('ASSERT_DEPENDENCY_STRICT');
    });

    it('should require paired sources for comparative claims', () => {
      const profile = createProfile({
        assertion: { type: AssertionType.COMPARATIVE },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.multiSourceRequired).toBe(true);
      expect(requirements.minSourceCount).toBeGreaterThanOrEqual(2);
      expect(requirements.applicableRules).toContain('ASSERT_COMPARATIVE_PAIRED');
    });

    it('should require literature survey for novelty claims', () => {
      const profile = createProfile({
        assertion: { type: AssertionType.NOVELTY },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.scholarlySupport).toBe('required');
      expect(requirements.multiSourceRequired).toBe(true);
      expect(requirements.applicableRules).toContain('ASSERT_NOVELTY_SURVEY');
    });

    it('should require justification for evaluative claims', () => {
      const profile = createProfile({
        assertion: { type: AssertionType.EVALUATIVE },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.applicableRules).toContain('ASSERT_EVALUATIVE_JUSTIFICATION');
    });
  });

  describe('Structure-Based Rules', () => {
    it('should require argument structure for inferential claims', () => {
      const profile = createProfile({
        structure: {
          type: StructureType.INFERENTIAL,
          connectives: [LogicalConnective.THEREFORE],
          inferenceType: InferenceType.DEDUCTIVE,
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.applicableRules).toContain('STRUCT_INFERENTIAL_PREMISES');
    });

    it('should require argument structure for conditional claims', () => {
      const profile = createProfile({
        structure: {
          type: StructureType.CONDITIONAL,
          connectives: [LogicalConnective.IF_THEN],
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.applicableRules).toContain('STRUCT_CONDITIONAL_BOTH');
    });

    it('should require causal support for explanatory claims', () => {
      const profile = createProfile({
        structure: {
          type: StructureType.EXPLANATORY,
          connectives: [LogicalConnective.BECAUSE],
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.applicableRules).toContain('STRUCT_EXPLANATORY_CAUSAL');
    });
  });

  describe('Modality-Based Rules', () => {
    it('should reduce requirements for speculative claims', () => {
      // Profile with speculative modality but WITHOUT direct attribution
      // (direct attribution rule has higher priority and forces mandatory)
      const profile = createProfile({
        attribution: { type: AttributionType.NONE },
        modality: { type: ModalityType.SPECULATIVE, hedges: [HedgeMarker.POSSIBILITY] },
      });

      const requirements = engine.computeRequirements(profile);

      // Without direct attribution, speculative modality can reduce requirements
      expect(requirements.exactGroundingRequired).toBe(false);
      expect(requirements.applicableRules).toContain('MODAL_SPECULATIVE_LENIENT');
    });

    it('should have minimal requirements for hypothetical claims', () => {
      const profile = createProfile({
        modality: { type: ModalityType.HYPOTHETICAL, perspective: 'hypothetical' },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.citationRequired).toBe('optional');
      expect(requirements.applicableRules).toContain('MODAL_HYPOTHETICAL_MINIMAL');
    });

    it('should require justification for interpreted claims', () => {
      const profile = createProfile({
        modality: { type: ModalityType.INTERPRETED, hedges: [HedgeMarker.INTERPRETIVE] },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.applicableRules).toContain('MODAL_INTERPRETED_JUSTIFICATION');
    });
  });

  describe('Epistemic Force Rules', () => {
    it('should require justification for evaluative force', () => {
      const profile = createProfile({
        epistemicForce: {
          type: EpistemicForceType.EVALUATIVE,
          evaluativeTerms: ['successfully'],
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.applicableRules).toContain('FORCE_EVALUATIVE_JUSTIFICATION');
    });

    it('should require strong support for normative claims', () => {
      const profile = createProfile({
        epistemicForce: { type: EpistemicForceType.NORMATIVE, normativeStrength: 0.8 },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.applicableRules).toContain('FORCE_NORMATIVE_STRONG');
    });
  });

  describe('Composite Rules', () => {
    it('should apply composite rule for interpretive + evaluative', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.INTERPRETIVE },
        epistemicForce: { type: EpistemicForceType.EVALUATIVE },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.citationRequired).toBe('optional');
      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.applicableRules).toContain('COMPOSITE_INTERP_EVAL');
    });

    it('should apply composite rule for direct + definitional', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.DIRECT },
        assertion: { type: AssertionType.DEFINITIONAL },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.exactGroundingRequired).toBe(true);
      expect(requirements.citationRequired).toBe('mandatory');
      expect(requirements.applicableRules).toContain('COMPOSITE_DIRECT_DEFINITIONAL');
    });

    it('should apply composite rule for inferential + evaluative', () => {
      const profile = createProfile({
        structure: { type: StructureType.INFERENTIAL },
        epistemicForce: { type: EpistemicForceType.EVALUATIVE },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.applicableRules).toContain('COMPOSITE_ENTAILED_EVALUATIVE');
    });

    it('should apply composite rule for speculative + interpretive', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.INTERPRETIVE },
        modality: { type: ModalityType.SPECULATIVE },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.citationRequired).toBe('optional');
      expect(requirements.justificationRequired).toBe(true);
      expect(requirements.exactGroundingRequired).toBe(false);
      expect(requirements.applicableRules).toContain('COMPOSITE_SPECULATIVE_INTERPRETIVE');
    });
  });

  describe('Example: Complex Multi-Faceted Claim', () => {
    it('should correctly compose requirements for "Therefore, Aristotle successfully resolves..."', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.DIRECT, authors: ['Aristotle'] },
        assertion: { type: AssertionType.EVALUATIVE },
        structure: {
          type: StructureType.INFERENTIAL,
          connectives: [LogicalConnective.THEREFORE],
        },
        modality: { type: ModalityType.ASSERTED, commitmentLevel: 1, perspective: 'endorsed' },
        epistemicForce: {
          type: EpistemicForceType.EVALUATIVE,
          evaluativeTerms: ['successfully', 'resolves'],
          normativeStrength: 0.8,
        },
      });

      const requirements = engine.computeRequirements(profile);

      expect(requirements.citationRequired).toBe('mandatory');
      expect(requirements.argumentStructureRequired).toBe(true);
      expect(requirements.justificationRequired).toBe(true);

      // Should have applied multiple rules
      expect(requirements.applicableRules).toContain('ATTR_DIRECT_CITATION');
      expect(requirements.applicableRules).toContain('STRUCT_INFERENTIAL_PREMISES');
      expect(requirements.applicableRules).toContain('ASSERT_EVALUATIVE_JUSTIFICATION');
    });
  });

  describe('Rule Management', () => {
    it('should return all rule IDs', () => {
      const ruleIds = engine.getRuleIds();
      expect(ruleIds.length).toBeGreaterThan(20); // We defined ~30 rules
      expect(ruleIds).toContain('ATTR_DIRECT_CITATION');
      expect(ruleIds).toContain('ATTR_ANONYMOUS_INVALID');
    });

    it('should get matching rules for a profile', () => {
      const profile = createProfile({
        attribution: { type: AttributionType.DIRECT },
      });

      const matchingRules = engine.getMatchingRules(profile);
      expect(matchingRules.length).toBeGreaterThan(0);
      expect(matchingRules.some((r) => r.id === 'ATTR_DIRECT_CITATION')).toBe(true);
    });

    it('should get rules by category', () => {
      const attributionRules = engine.getRulesByCategory('attribution');
      const compositeRules = engine.getRulesByCategory('composite');

      expect(attributionRules.length).toBeGreaterThan(0);
      expect(compositeRules.length).toBeGreaterThan(0);
      expect(attributionRules.every((r) => r.category === 'attribution')).toBe(true);
    });
  });
});

describe('computeRiskLevel', () => {
  const createProfile = (
    overrides: Partial<{
      attribution: Partial<ClaimProfile['attribution']>;
      assertion: Partial<ClaimProfile['assertion']>;
      structure: Partial<ClaimProfile['structure']>;
      modality: Partial<ClaimProfile['modality']>;
      epistemicForce: Partial<ClaimProfile['epistemicForce']>;
    }>
  ): ClaimProfile => mergeWithDefaults(overrides);

  it('should return critical risk for anonymous authority', () => {
    const profile = createProfile({
      attribution: { type: AttributionType.ANONYMOUS },
    });

    expect(computeRiskLevel(profile)).toBe('critical');
  });

  it('should return elevated risk for modal claims', () => {
    const profile = createProfile({
      assertion: { type: AssertionType.MODAL },
    });

    const risk = computeRiskLevel(profile);
    // Modal claims add 2 to risk score, putting them at medium or higher
    expect(['medium', 'high', 'critical']).toContain(risk);
  });

  it('should return elevated risk for dependency claims', () => {
    const profile = createProfile({
      assertion: { type: AssertionType.DEPENDENCY },
    });

    const risk = computeRiskLevel(profile);
    // Dependency claims add 2 to risk score, putting them at medium or higher
    expect(['medium', 'high', 'critical']).toContain(risk);
  });

  it('should reduce risk for speculative claims', () => {
    const assertedProfile = createProfile({
      attribution: { type: AttributionType.DIRECT },
      modality: { type: ModalityType.ASSERTED },
    });

    const speculativeProfile = createProfile({
      attribution: { type: AttributionType.DIRECT },
      modality: { type: ModalityType.SPECULATIVE },
    });

    const assertedRisk = computeRiskLevel(assertedProfile);
    const speculativeRisk = computeRiskLevel(speculativeProfile);

    // Speculative should have equal or lower risk
    const riskOrder = ['low', 'medium', 'high', 'critical'];
    expect(riskOrder.indexOf(speculativeRisk)).toBeLessThanOrEqual(
      riskOrder.indexOf(assertedRisk)
    );
  });

  it('should return low risk for simple descriptive claims', () => {
    const profile = createProfile({
      attribution: { type: AttributionType.NONE },
      assertion: { type: AssertionType.FACTUAL },
      modality: { type: ModalityType.ASSERTED },
      epistemicForce: { type: EpistemicForceType.DESCRIPTIVE },
    });

    expect(computeRiskLevel(profile)).toBe('low');
  });
});

describe('generateSuggestions', () => {
  it('should suggest adding citation', () => {
    const requirements = {
      citationRequired: 'mandatory' as const,
      exactGroundingRequired: false,
      justificationRequired: false,
      multiSourceRequired: false,
      scholarlySupport: 'optional' as const,
      argumentStructureRequired: false,
      applicableRules: [],
      rationale: '',
    };

    const suggestions = generateSuggestions(requirements, ['citation']);
    expect(suggestions.some((s) => s.includes('citation'))).toBe(true);
  });

  it('should suggest exact textual evidence', () => {
    const requirements = {
      citationRequired: 'optional' as const,
      exactGroundingRequired: true,
      justificationRequired: false,
      multiSourceRequired: false,
      scholarlySupport: 'optional' as const,
      argumentStructureRequired: false,
      applicableRules: [],
      rationale: '',
    };

    const suggestions = generateSuggestions(requirements, ['exactGrounding']);
    expect(suggestions.some((s) => s.includes('exact') || s.includes('quote'))).toBe(true);
  });

  it('should suggest multiple sources with count', () => {
    const requirements = {
      citationRequired: 'mandatory' as const,
      exactGroundingRequired: false,
      justificationRequired: false,
      multiSourceRequired: true,
      minSourceCount: 3,
      scholarlySupport: 'optional' as const,
      argumentStructureRequired: false,
      applicableRules: [],
      rationale: '',
    };

    const suggestions = generateSuggestions(requirements, ['multiSource']);
    expect(suggestions.some((s) => s.includes('3'))).toBe(true);
  });
});
