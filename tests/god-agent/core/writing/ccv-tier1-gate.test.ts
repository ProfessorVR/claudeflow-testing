/**
 * Tests for CCV Tier 1 Gate - Inline Claim Detection and Citation Enforcement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CcvTier1Gate,
  createCcvTier1Gate,
  shouldEnforceCitation,
  enforceCitationRequirements,
  isCompositeClaim,
  type CcvTier1Config,
  type Tier1EvaluationResult,
} from '../../../../src/god-agent/core/writing/ccv-tier1-gate.js';
import {
  AttributionType,
  AssertionType,
  EpistemicForceType,
  StructureType,
  createDefaultProfile,
} from '../../../../src/god-agent/core/writing/claim-profile.js';
import type { DetectedClaim } from '../../../../src/god-agent/core/writing/claim-detector.js';

// =============================================================================
// HELPERS
// =============================================================================

function createMockClaim(overrides: Partial<DetectedClaim> = {}): DetectedClaim {
  const defaultProfile = createDefaultProfile();
  return {
    id: 'claim-001',
    text: 'Aristotle argues that phantasia mediates between perception and thought.',
    position: { line: 1, char: 0, sentenceIndex: 0, paragraphIndex: 0 },
    profile: {
      ...defaultProfile,
      attribution: {
        type: AttributionType.DIRECT,
        authors: ['Aristotle'],
        inherited: false,
      },
      assertion: {
        type: AssertionType.TEXTUAL,
        secondary: [],
      },
      epistemicForce: {
        type: EpistemicForceType.DESCRIPTIVE,
        markers: [],
      },
      ...overrides.profile,
    },
    riskLevel: 'high',
    validationRequirements: {
      citationRequired: 'mandatory',
      exactGroundingRequired: false,
      justificationRequired: false,
      multiSourceRequired: false,
      scholarlySupport: 'mandatory',
      argumentStructureRequired: false,
      applicableRules: ['ATTR_DIRECT_CITATION'],
      rationale: 'Direct attribution requires citation',
      ...overrides.validationRequirements,
    },
    commitment: 'source',
    retrievalAttribution: {
      author: 'Aristotle',
      confidence: 0.9,
      inherited: false,
      distanceFromSource: 0,
      ...overrides.retrievalAttribution,
    },
    context: {
      surrounding: '',
      ...overrides.context,
    },
    ...overrides,
  } as DetectedClaim;
}

// =============================================================================
// TESTS
// =============================================================================

describe('CcvTier1Gate', () => {
  let gate: CcvTier1Gate;

  beforeEach(() => {
    gate = new CcvTier1Gate({ strictness: 'moderate' });
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const g = new CcvTier1Gate();
      expect(g).toBeInstanceOf(CcvTier1Gate);
    });

    it('should create with custom config', () => {
      const g = new CcvTier1Gate({
        strictness: 'strict',
        maxClaimsPerParagraph: 50,
      });
      expect(g).toBeInstanceOf(CcvTier1Gate);
    });

    it('should create via factory function', () => {
      const g = createCcvTier1Gate({ strictness: 'lenient' });
      expect(g).toBeInstanceOf(CcvTier1Gate);
    });
  });

  describe('evaluate', () => {
    it('should return pass result when disabled', async () => {
      const g = new CcvTier1Gate({ enabled: false });
      const result = await g.evaluate('Some text.', []);

      expect(result.passed).toBe(true);
      expect(result.claims).toHaveLength(0);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect claims in academic text', async () => {
      const text = 'Aristotle argues that phantasia is a faculty of the soul that mediates between perception and thought. This capacity enables practical reasoning and deliberation.';
      const citations = [{ author: 'Aristotle', year: 1984 }];

      const result = await gate.evaluate(text, citations);

      expect(result.stats.totalClaims).toBeGreaterThan(0);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should pass when citations are present for attributed claims', async () => {
      const text = 'Aristotle argues that the soul has multiple capacities.';
      const citations = [{ author: 'Aristotle', year: 1984 }];

      const result = await gate.evaluate(text, citations);

      // Should not flag issues when citation is present
      const mandatoryMissing = result.issues.filter(
        i => i.citationRequirement === 'mandatory' && i.severity !== 'minor'
      );
      expect(mandatoryMissing).toHaveLength(0);
    });

    it('should track statistics correctly', async () => {
      const text = 'This is a simple paragraph without strong claims.';
      const result = await gate.evaluate(text, []);

      expect(result.stats).toHaveProperty('totalClaims');
      expect(result.stats).toHaveProperty('claimsRequiringCitation');
      expect(result.stats).toHaveProperty('claimsMissingCitation');
      expect(result.stats).toHaveProperty('compositeClaimsDecomposed');
      expect(result.stats).toHaveProperty('claimsByRisk');
    });
  });

  describe('formatFeedback', () => {
    it('should return empty string for no issues', () => {
      const feedback = gate.formatFeedback([]);
      expect(feedback).toBe('');
    });

    it('should format issues into actionable feedback', () => {
      const issues = [{
        severity: 'major' as const,
        category: 'missing-citation' as const,
        claimText: 'Aristotle argues that phantasia mediates deliberation',
        claimId: 'c1',
        riskLevel: 'high' as const,
        citationRequirement: 'mandatory' as const,
        applicableRules: ['ATTR_DIRECT_CITATION'],
        rationale: 'Direct attribution requires citation',
        suggestedAction: 'Add citation from Aristotle\'s corpus',
      }];

      const feedback = gate.formatFeedback(issues);

      expect(feedback).toContain('CLAIM VALIDATION ERRORS');
      expect(feedback).toContain('citation_lookup');
      expect(feedback).toContain('MAJOR');
    });

    it('should handle composite claim issues with sub-claims', () => {
      const issues = [{
        severity: 'major' as const,
        category: 'composite-gap' as const,
        claimText: 'Both phantasia and aisthesis function as mediating capacities',
        claimId: 'c2',
        riskLevel: 'medium' as const,
        citationRequirement: 'mandatory' as const,
        applicableRules: ['STRUCT_COMPOUND'],
        rationale: 'Compound claim requires per-subclaim citation',
        suggestedAction: 'Add citations for each sub-claim',
        subClaimIssues: [
          { subClaimText: 'phantasia functions as a mediating capacity', citationRequired: true, hasCitation: false },
          { subClaimText: 'aisthesis functions as a mediating capacity', citationRequired: true, hasCitation: false },
        ],
      }];

      const feedback = gate.formatFeedback(issues);

      expect(feedback).toContain('COMPOSITE');
      expect(feedback).toContain('sub-claims need citation');
    });
  });

  describe('createArtifacts', () => {
    it('should create Tier 1 artifacts for cross-tier reuse', async () => {
      const text = 'A simple sentence.';
      const result = await gate.evaluate(text, []);

      const artifacts = gate.createArtifacts(result, 0);

      expect(artifacts.paragraphIndex).toBe(0);
      expect(artifacts.detectorVersion).toBeDefined();
      expect(artifacts.detectedAt).toBeGreaterThan(0);
      expect(artifacts.claims).toEqual(result.claims);
      expect(artifacts.decompositions).toEqual(result.decompositions);
    });
  });
});

describe('shouldEnforceCitation', () => {
  it('should enforce mandatory when ValidationRuleEngine says mandatory', () => {
    const claim = createMockClaim({
      validationRequirements: {
        citationRequired: 'mandatory',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'mandatory',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    expect(shouldEnforceCitation(claim, 'moderate')).toBe('mandatory');
    expect(shouldEnforceCitation(claim, 'lenient')).toBe('mandatory');
  });

  it('should enforce factual claims with strong epistemic force', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        assertion: { type: AssertionType.FACTUAL, secondary: [] },
        epistemicForce: { type: EpistemicForceType.DESCRIPTIVE, markers: [] },
      },
      validationRequirements: {
        citationRequired: 'optional',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    expect(shouldEnforceCitation(claim, 'strict')).toBe('mandatory');
    expect(shouldEnforceCitation(claim, 'moderate')).toBe('recommended');
  });

  it('should skip evaluative essay claims', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        assertion: { type: AssertionType.EVALUATIVE, secondary: [] },
        epistemicForce: { type: EpistemicForceType.EVALUATIVE, markers: [] },
      },
      validationRequirements: {
        citationRequired: 'optional',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    expect(shouldEnforceCitation(claim, 'moderate')).toBe('skip');
  });

  it('should follow recommended when rule engine says recommended', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        assertion: { type: AssertionType.EVALUATIVE, secondary: [] },
        epistemicForce: { type: EpistemicForceType.EVALUATIVE, markers: [] },
      },
      validationRequirements: {
        citationRequired: 'recommended',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    expect(shouldEnforceCitation(claim, 'moderate')).toBe('recommended');
  });
});

describe('enforceCitationRequirements', () => {
  it('should pass when citation is optional', () => {
    const claim = createMockClaim({
      validationRequirements: {
        citationRequired: 'optional',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    const result = enforceCitationRequirements(claim, []);
    expect(result.passed).toBe(true);
  });

  it('should fail DIRECT high-confidence without author match', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        attribution: { type: AttributionType.DIRECT, authors: ['Aristotle'], inherited: false },
      },
      commitment: 'source',
      retrievalAttribution: { author: 'Aristotle', confidence: 0.9, inherited: false, distanceFromSource: 0 },
      validationRequirements: {
        citationRequired: 'mandatory',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'mandatory',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    // Citation exists but for wrong author
    const result = enforceCitationRequirements(claim, [{ author: 'Plato', year: 2000 }]);
    expect(result.passed).toBe(false);
    expect(result.issue?.category).toBe('missing-citation');
  });

  it('should pass DIRECT high-confidence with author match', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        attribution: { type: AttributionType.DIRECT, authors: ['Aristotle'], inherited: false },
      },
      commitment: 'source',
      retrievalAttribution: { author: 'Aristotle', confidence: 0.9, inherited: false, distanceFromSource: 0 },
      validationRequirements: {
        citationRequired: 'mandatory',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'mandatory',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    const result = enforceCitationRequirements(claim, [{ author: 'Aristotle', year: 1984 }]);
    expect(result.passed).toBe(true);
  });

  it('should pass INTERPRETIVE with any citation present', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        attribution: { type: AttributionType.INTERPRETIVE, authors: ['Aristotle'], inherited: false },
      },
      commitment: 'essay',
      retrievalAttribution: { author: 'Aristotle', confidence: 0.5, inherited: false, distanceFromSource: 0 },
      validationRequirements: {
        citationRequired: 'mandatory',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'mandatory',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    // Interpreter citation, not primary source
    const result = enforceCitationRequirements(claim, [{ author: 'Caston', year: 2005 }]);
    expect(result.passed).toBe(true);
    // Should include minor warning about no primary source
    expect(result.issue?.severity).toBe('minor');
    expect(result.issue?.category).toBe('weak-attribution');
  });

  it('should fail when no citations and mandatory', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        attribution: { type: AttributionType.INTERPRETIVE, inherited: false },
      },
      commitment: 'essay',
      validationRequirements: {
        citationRequired: 'mandatory',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'mandatory',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    const result = enforceCitationRequirements(claim, []);
    expect(result.passed).toBe(false);
  });

  it('should pass with warning for recommended missing citation', () => {
    const claim = createMockClaim({
      validationRequirements: {
        citationRequired: 'recommended',
        exactGroundingRequired: false,
        justificationRequired: false,
        multiSourceRequired: false,
        scholarlySupport: 'optional',
        argumentStructureRequired: false,
        applicableRules: [],
        rationale: '',
      },
    });

    const result = enforceCitationRequirements(claim, []);
    expect(result.passed).toBe(true);
    expect(result.issue?.severity).toBe('minor');
  });
});

describe('isCompositeClaim', () => {
  it('should identify conjunctive claims', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        structure: {
          type: StructureType.CONJUNCTIVE,
          connectives: [],
          atomicClaimCount: 2,
        },
      },
    });
    expect(isCompositeClaim(claim)).toBe(true);
  });

  it('should identify atomic claims', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        structure: {
          type: StructureType.ATOMIC,
          connectives: [],
          atomicClaimCount: 1,
        },
      },
    });
    expect(isCompositeClaim(claim)).toBe(false);
  });

  it('should identify claims with multiple atomic subclaims', () => {
    const claim = createMockClaim({
      profile: {
        ...createDefaultProfile(),
        structure: {
          type: StructureType.ATOMIC,
          connectives: [],
          atomicClaimCount: 3, // > 1 means composite
        },
      },
    });
    expect(isCompositeClaim(claim)).toBe(true);
  });
});
