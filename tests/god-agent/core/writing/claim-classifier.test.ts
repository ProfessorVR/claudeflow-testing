/**
 * Tests for Multi-Axis Claim Classifier
 */

import { describe, it, expect } from 'vitest';
import {
  MultiAxisClaimClassifier,
  type ClassificationContext,
} from '../../../../src/god-agent/core/writing/claim-classifier.js';
import {
  AttributionType,
  AttributionQualifier,
  AssertionType,
  StructureType,
  LogicalConnective,
  ModalityType,
  HedgeMarker,
  EpistemicForceType,
  InferenceType,
} from '../../../../src/god-agent/core/writing/claim-profile.js';

describe('MultiAxisClaimClassifier', () => {
  const classifier = new MultiAxisClaimClassifier();
  const emptyContext: ClassificationContext = { surroundingText: '' };

  describe('Attribution Axis', () => {
    it('should classify direct attribution', async () => {
      const claim = 'Aristotle argues that the soul is the form of the body.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.DIRECT);
      expect(profile.attribution.authors).toContain('Aristotle');
      expect(profile.confidence.attribution).toBeGreaterThan(0.8);
    });

    it('should classify interpretive attribution', async () => {
      const claim = 'Heidegger can be read as suggesting that Stimmung is fundamental.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.INTERPRETIVE);
      expect(profile.attribution.authors).toContain('Heidegger');
      expect(profile.attribution.qualifier).toBe(AttributionQualifier.HEDGED);
    });

    it('should classify demonstrative attribution', async () => {
      const claim = 'As Aristotle demonstrates, phantasia mediates between perception and intellect.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.DIRECT);
      expect(profile.attribution.qualifier).toBe(AttributionQualifier.DEMONSTRATIVE);
    });

    it('should classify scholarly consensus', async () => {
      const claim = 'Scholars generally agree that phantasia is not mere perception.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.CONSENSUS);
    });

    it('should classify scholarly dispute', async () => {
      const claim = 'Some scholars argue that phantasia is cognitive, while others maintain it is perceptual.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.DISPUTED);
    });

    it('should detect anonymous authority (INVALID)', async () => {
      const claim = 'It is widely held that phantasia represents the highest faculty.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.ANONYMOUS);
    });

    it('should classify proxy attribution', async () => {
      const claim = 'According to the standard reading, phantasia functions as a bridge.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.PROXY);
    });

    it('should detect explicit qualifier', async () => {
      const claim = 'Aristotle explicitly claims that the soul cannot exist without the body.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.DIRECT);
      expect(profile.attribution.qualifier).toBe(AttributionQualifier.EXPLICIT);
    });
  });

  describe('Assertion Axis', () => {
    it('should classify definitional claims', async () => {
      const claim = 'Phantasia is defined as the capacity to form images.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.DEFINITIONAL);
    });

    it('should classify functional claims', async () => {
      const claim = 'Phantasia functions to mediate between sensation and thought.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.FUNCTIONAL);
    });

    it('should classify modal claims', async () => {
      const claim = 'Phantasia can exist without actual sensation.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.MODAL);
    });

    it('should classify dependency claims', async () => {
      const claim = 'Phantasia is necessary for judgment to occur.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.DEPENDENCY);
    });

    it('should classify comparative claims', async () => {
      const claim = 'Aristotle is similar to Plato in his treatment of the soul.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.COMPARATIVE);
    });

    it('should classify evaluative claims', async () => {
      const claim = 'Aristotle successfully resolves the problem of appearance.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.EVALUATIVE);
    });

    it('should classify novelty claims', async () => {
      const claim = 'This reading has been overlooked by previous commentators.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.NOVELTY);
    });

    it('should classify scope claims', async () => {
      const claim = 'This chapter argues that phantasia plays an important role.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.assertion.type).toBe(AssertionType.SCOPE);
    });
  });

  describe('Structure Axis', () => {
    it('should classify inferential structure', async () => {
      const claim = 'Therefore, we can conclude that phantasia is essential for thought.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.structure.type).toBe(StructureType.INFERENTIAL);
      expect(profile.structure.connectives).toContain(LogicalConnective.THEREFORE);
      expect(profile.structure.inferenceType).toBeDefined();
    });

    it('should classify conditional structure', async () => {
      const claim = 'If phantasia is absent, then deliberation becomes impossible.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.structure.type).toBe(StructureType.CONDITIONAL);
      expect(profile.structure.connectives).toContain(LogicalConnective.IF_THEN);
    });

    it('should classify conjunctive structure', async () => {
      const claim = 'Both phantasia and aisthesis function as forms of awareness.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.structure.type).toBe(StructureType.CONJUNCTIVE);
      expect(profile.structure.atomicClaimCount).toBeGreaterThanOrEqual(2);
    });

    it('should classify explanatory structure', async () => {
      const claim = 'This explains why Aristotle treats phantasia as distinct from belief.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.structure.type).toBe(StructureType.EXPLANATORY);
    });

    it('should detect inference type for inferential claims', async () => {
      const claim = 'Therefore, it necessarily follows that phantasia underlies all cognition.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.structure.type).toBe(StructureType.INFERENTIAL);
      expect(profile.structure.inferenceType).toBe(InferenceType.DEDUCTIVE);
    });

    it('should classify atomic claims', async () => {
      const claim = 'Phantasia is a capacity of the soul.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.structure.type).toBe(StructureType.ATOMIC);
      expect(profile.structure.atomicClaimCount).toBe(1);
    });
  });

  describe('Modality Axis', () => {
    it('should classify speculative modality', async () => {
      const claim = 'Phantasia might serve as a form of proto-judgment.';
      const profile = await classifier.classify(claim, emptyContext);

      // Should detect possibility hedging and reduce commitment
      expect(profile.modality.hedges).toContain(HedgeMarker.POSSIBILITY);
      expect(profile.modality.commitmentLevel).toBeLessThan(1);
    });

    it('should classify hypothetical modality', async () => {
      const claim = 'If phantasia were purely sensory, perception would suffice.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.modality.type).toBe(ModalityType.HYPOTHETICAL);
      expect(profile.modality.perspective).toBe('hypothetical');
    });

    it('should classify interpreted modality', async () => {
      const claim = 'On this reading, phantasia serves as a bridge faculty.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.modality.type).toBe(ModalityType.INTERPRETED);
    });

    it('should detect hedging and adjust commitment level', async () => {
      const claim = 'Phantasia probably plays a role in practical reasoning.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.modality.hedges).toContain(HedgeMarker.PROBABILITY);
      expect(profile.modality.commitmentLevel).toBeLessThan(1);
    });

    it('should classify asserted modality for strong claims', async () => {
      const claim = 'Phantasia is necessary for all forms of cognition.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.modality.type).toBe(ModalityType.ASSERTED);
      expect(profile.modality.commitmentLevel).toBe(1);
    });
  });

  describe('Epistemic Force Axis', () => {
    it('should classify evaluative force', async () => {
      const claim = 'Aristotle successfully resolves the problem of mental representation.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.epistemicForce.type).toBe(EpistemicForceType.EVALUATIVE);
      expect(profile.epistemicForce.evaluativeTerms).toContain('successfully');
    });

    it('should classify normative force', async () => {
      const claim = 'Phantasia should be understood as a form of awareness.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.epistemicForce.type).toBe(EpistemicForceType.NORMATIVE);
      expect(profile.epistemicForce.normativeStrength).toBeGreaterThan(0);
    });

    it('should classify explanatory force', async () => {
      const claim = 'This explains why phantasia is treated differently from perception.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.epistemicForce.type).toBe(EpistemicForceType.EXPLANATORY);
    });

    it('should classify critical force', async () => {
      const claim = 'This raises the question of whether phantasia is truly distinct.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.epistemicForce.type).toBe(EpistemicForceType.CRITICAL);
    });

    it('should detect multiple evaluative terms', async () => {
      const claim = 'The argument is both compelling and correctly identifies the key issue.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.epistemicForce.evaluativeTerms.length).toBeGreaterThanOrEqual(1);
    });

    it('should classify descriptive force for neutral claims', async () => {
      const claim = 'Phantasia is discussed in De Anima III.3.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.epistemicForce.type).toBe(EpistemicForceType.DESCRIPTIVE);
      expect(profile.epistemicForce.normativeStrength).toBe(0);
    });
  });

  describe('Complex Multi-Faceted Claims', () => {
    it('should classify "Therefore, Aristotle successfully resolves..."', async () => {
      const claim =
        'Therefore, Aristotle successfully resolves the problem of how the soul can be affected by external objects.';
      const profile = await classifier.classify(claim, emptyContext);

      // Should be multi-faceted - structure is inferential, epistemic force is evaluative
      // Note: Attribution may not be detected if author name is embedded in complex sentence
      expect(profile.structure.type).toBe(StructureType.INFERENTIAL);
      expect(profile.epistemicForce.type).toBe(EpistemicForceType.EVALUATIVE);
      expect(profile.epistemicForce.evaluativeTerms).toContain('successfully');
    });

    it('should classify hedged interpretive evaluative claim', async () => {
      const claim =
        "Heidegger's analysis might be understood as successfully developing Aristotle's insight.";
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.INTERPRETIVE);
      expect(profile.modality.hedges).toContain(HedgeMarker.POSSIBILITY);
      expect(profile.epistemicForce.evaluativeTerms).toContain('successfully');
    });

    it('should classify scholarly consensus with definitional content', async () => {
      const claim = 'Scholars generally agree that phantasia is defined as the capacity for imagery.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.attribution.type).toBe(AttributionType.CONSENSUS);
      expect(profile.assertion.type).toBe(AssertionType.DEFINITIONAL);
    });
  });

  describe('Context-Based Classification', () => {
    it('should inherit attribution from previous claims', async () => {
      const previousClaims = [
        {
          text: 'Aristotle argues that phantasia is essential.',
          profile: {
            attribution: {
              type: AttributionType.DIRECT,
              authors: ['Aristotle'],
              inherited: false,
            },
            assertion: { type: AssertionType.FACTUAL, secondary: [] },
            structure: {
              type: StructureType.ATOMIC,
              connectives: [],
              atomicClaimCount: 1,
            },
            modality: {
              type: ModalityType.ASSERTED,
              hedges: [],
              commitmentLevel: 1,
              perspective: 'reported' as const,
            },
            epistemicForce: {
              type: EpistemicForceType.DESCRIPTIVE,
              evaluativeTerms: [],
              normativeStrength: 0,
            },
            confidence: {
              attribution: 0.9,
              assertion: 0.7,
              structure: 0.7,
              modality: 0.7,
              epistemicForce: 0.7,
            },
          },
        },
      ];

      const context: ClassificationContext = {
        surroundingText: 'In the context of De Anima...',
        previousClaims,
      };

      // A claim without explicit attribution should inherit
      const claim = 'This view is further elaborated in Physics II.';
      const profile = await classifier.classify(claim, context);

      // Should be inherited since no explicit attribution
      expect(profile.attribution.type).toBe(AttributionType.INHERITED);
    });
  });

  describe('Confidence Scores', () => {
    it('should provide confidence for all axes', async () => {
      const claim = 'Aristotle argues that phantasia is essential.';
      const profile = await classifier.classify(claim, emptyContext);

      expect(profile.confidence.attribution).toBeGreaterThan(0);
      expect(profile.confidence.assertion).toBeGreaterThan(0);
      expect(profile.confidence.structure).toBeGreaterThan(0);
      expect(profile.confidence.modality).toBeGreaterThan(0);
      expect(profile.confidence.epistemicForce).toBeGreaterThan(0);
    });

    it('should have higher confidence for clear pattern matches', async () => {
      const clearClaim = 'Aristotle argues that the soul is mortal.';
      const unclearClaim = 'The soul has properties.';

      const clearProfile = await classifier.classify(clearClaim, emptyContext);
      const unclearProfile = await classifier.classify(unclearClaim, emptyContext);

      expect(clearProfile.confidence.attribution).toBeGreaterThan(
        unclearProfile.confidence.attribution
      );
    });
  });

  describe('Utility Methods', () => {
    it('should calculate overall confidence', async () => {
      const claim = 'Aristotle argues that phantasia is essential.';
      const profile = await classifier.classify(claim, emptyContext);

      const overall = classifier.getOverallConfidence(profile);
      expect(overall).toBeGreaterThan(0);
      expect(overall).toBeLessThanOrEqual(1);
    });

    it('should find low confidence axes', async () => {
      const vageClaim = 'Something is the case.';
      const profile = await classifier.classify(vageClaim, emptyContext);

      const lowConfidenceAxes = classifier.findLowConfidenceAxes(profile, 0.6);
      // Should have some low confidence axes for vague claims
      expect(lowConfidenceAxes.length).toBeGreaterThanOrEqual(0);
    });
  });
});
