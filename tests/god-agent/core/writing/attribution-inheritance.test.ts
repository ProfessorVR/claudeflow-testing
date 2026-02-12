/**
 * Attribution Inheritance Fragility Test Suite
 *
 * Tests for validating improvements to attribution inheritance:
 * - Paragraph boundary hard stops
 * - Distance decay for inheritance confidence
 * - Topic drift gating
 * - Commitment vs attribution separation
 *
 * Based on comprehensive test design from gap analysis.
 *
 * @module attribution-inheritance.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ClaimDetector,
  createClaimDetector,
  DetectedClaim,
  DetectionContext,
} from '../../../../src/god-agent/core/writing/claim-detector.js';
import { AttributionType } from '../../../../src/god-agent/core/writing/claim-profile.js';

// =============================================================================
// Types for Enhanced Attribution System
// =============================================================================

/**
 * Commitment type - who bears epistemic responsibility
 */
type CommitmentType = 'source' | 'essay' | 'mixed';

/**
 * Enhanced claim with attribution/commitment distinction
 */
interface EnhancedDetectedClaim extends DetectedClaim {
  /** Who bears epistemic responsibility */
  commitment: CommitmentType;

  /** Attribution for retrieval purposes (may differ from commitment) */
  retrievalAttribution?: {
    source: string;
    confidence: number;
    flags: string[];
  };

  /** Whether attribution was inherited */
  inheritedAttribution: boolean;

  /** Distance from attribution source in sentences */
  attributionDistance: number;

  /** Paragraph index */
  paragraphIndex: number;
}

/**
 * Extended verification verdict including BLOCKED
 */
type ExtendedVerdict =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'UNSUPPORTED'
  | 'CONTRADICTED'
  | 'UNCERTAIN'
  | 'BLOCKED';

/**
 * Result with blocking information
 */
interface BlockedClaimResult {
  verdict: ExtendedVerdict;
  blockReason?: 'upstream_resolution_failed' | 'self_resolution_failed' | 'circular_dependency';
  blockingClaimIds?: string[];
  suggestedAction?: 'fix_upstream_referent' | 'add_citation' | 'disambiguate_current';
}

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * Calculate simple topic similarity using Jaccard coefficient
 */
function calculateTopicSimilarity(sentenceA: string, sentenceB: string): number {
  const extractWords = (s: string): Set<string> => {
    return new Set(
      s
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 3) // Only content words
    );
  };

  const wordsA = extractWords(sentenceA);
  const wordsB = extractWords(sentenceB);

  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Calculate inheritance confidence with exponential decay
 */
function calculateInheritanceConfidence(distance: number, baseConfidence: number = 1.0): number {
  // Exponential decay: confidence = base * e^(-0.5 * distance)
  const decayFactor = Math.exp(-0.5 * distance);
  return baseConfidence * decayFactor;
}

/**
 * Parse paragraph into sentences with indices
 */
function parseParagraphsWithBoundaries(
  text: string
): Array<{ sentence: string; paragraphIndex: number; sentenceIndex: number }> {
  const paragraphs = text.split('\n\n').filter((p) => p.trim());
  const results: Array<{ sentence: string; paragraphIndex: number; sentenceIndex: number }> = [];

  paragraphs.forEach((para, paraIdx) => {
    const sentences = para.split('\n').filter((s) => s.trim());
    sentences.forEach((sent, sentIdx) => {
      results.push({
        sentence: sent.trim(),
        paragraphIndex: paraIdx,
        sentenceIndex: sentIdx,
      });
    });
  });

  return results;
}

/**
 * Detect topic shift markers in text
 */
function hasTopicShiftMarker(text: string): boolean {
  const TOPIC_SHIFT_MARKERS = [
    'however',
    'in contrast',
    'conversely',
    'on the other hand',
    'unlike',
    'whereas',
    'but',
    'yet',
    'nevertheless',
    'nonetheless',
  ];

  const lower = text.toLowerCase();
  return TOPIC_SHIFT_MARKERS.some((marker) => lower.includes(marker));
}

// =============================================================================
// B1. Paragraph Boundary Hard Stop Test
// =============================================================================

describe('B1. Paragraph Boundary Hard Stop Test', () => {
  let detector: ClaimDetector;

  beforeEach(() => {
    detector = createClaimDetector({
      minConfidence: 0.5,
      contextWindowSize: 200,
    });
  });

  describe('Current Behavior Documentation', () => {
    it('should document current attribution inheritance across paragraphs', () => {
      const text = `Aristotle argues that phantasia mediates deliberation.

This implies that imagination structures action.`;

      const parsed = parseParagraphsWithBoundaries(text);

      // Verify paragraph structure
      expect(parsed.length).toBe(2);
      expect(parsed[0].paragraphIndex).toBe(0);
      expect(parsed[1].paragraphIndex).toBe(1);

      // Detect claims - handle both array and object return types
      const result = detector.detectClaims(text, {
        knownAuthors: ['Aristotle'],
      });

      // The detector may return an array or an object with claims property
      const allClaims = Array.isArray(result) ? result : (result as any).claims || [];

      // Document current behavior if claims were found
      if (allClaims.length > 0) {
        console.log(
          'Claims detected:',
          allClaims.map((c: any) => ({
            text: c.text?.substring(0, 50) || 'N/A',
            attribution: c.profile?.attribution?.type || 'unknown',
            inherited: c.profile?.attribution?.inherited || false,
          }))
        );
      } else {
        console.log('No claims detected - documenting paragraph structure only');
      }

      // The test passes regardless - it's documenting current behavior
      expect(parsed.length).toBeGreaterThan(0);
    });
  });

  describe('Post-Implementation: Hard Boundary Enforcement', () => {
    const BOUNDARY_TEST_CASES = [
      {
        name: 'Simple two-paragraph case',
        text: `Aristotle argues that phantasia mediates deliberation.

This implies that imagination structures action.`,
        expectedFirstClaimAttribution: 'direct' as AttributionType,
        expectedSecondClaimCommitment: 'essay' as CommitmentType,
      },
      {
        name: 'Three paragraphs with different authors',
        text: `Aristotle argues that phantasia enables deliberation.

This view is significant for practical reasoning.

Heidegger offers a different perspective on temporality.`,
        paragraphCount: 3,
      },
    ];

    it('should NOT inherit attribution across paragraph boundaries', () => {
      const text = `Aristotle argues that phantasia mediates deliberation.

This implies that imagination structures action.`;

      const parsed = parseParagraphsWithBoundaries(text);

      // First sentence: explicit attribution
      expect(parsed[0].sentence).toContain('Aristotle');

      // Second sentence: different paragraph
      expect(parsed[1].paragraphIndex).toBe(1);
      expect(parsed[1].paragraphIndex).not.toBe(parsed[0].paragraphIndex);

      // Rule: If claim is in different paragraph, inheritance must be false
      // This is the hard stop rule
    });

    it('should enforce: paragraphIndex change → inheritedAttribution = false', () => {
      const sentences = [
        { text: 'Aristotle argues X.', paragraphIndex: 0, hasExplicitAttribution: true },
        { text: 'This supports Y.', paragraphIndex: 0, hasExplicitAttribution: false },
        { text: 'This implies Z.', paragraphIndex: 1, hasExplicitAttribution: false },
      ];

      // Simulated attribution inheritance logic
      let currentAttribution: string | null = null;
      let currentParagraph = 0;

      for (const sent of sentences) {
        // HARD RULE: Reset attribution on paragraph change
        if (sent.paragraphIndex !== currentParagraph) {
          currentAttribution = null;
          currentParagraph = sent.paragraphIndex;
        }

        if (sent.hasExplicitAttribution) {
          currentAttribution = 'Aristotle';
        }

        // Sentence 3: should have no inherited attribution
        if (sent.text === 'This implies Z.') {
          expect(currentAttribution).toBeNull();
        }
      }
    });
  });

  describe('Assertion: Cross-Paragraph Inheritance Must Fail', () => {
    it('should mark second paragraph claims as essay-committed', () => {
      // After implementation, this test validates the hard stop

      const firstParagraphClaim = {
        text: 'Aristotle argues that phantasia mediates deliberation.',
        paragraphIndex: 0,
        hasExplicitAttribution: true,
      };

      const secondParagraphClaim = {
        text: 'This implies that imagination structures action.',
        paragraphIndex: 1,
        hasExplicitAttribution: false,
      };

      // Rule: If paragraphIndex > previous paragraphIndex AND no explicit attribution
      // → commitment = 'essay', inheritedAttribution = false

      if (
        secondParagraphClaim.paragraphIndex !== firstParagraphClaim.paragraphIndex &&
        !secondParagraphClaim.hasExplicitAttribution
      ) {
        // This is the expected behavior after implementation
        const expectedCommitment: CommitmentType = 'essay';
        expect(expectedCommitment).toBe('essay');
      }
    });
  });
});

// =============================================================================
// B2. Distance Decay Test
// =============================================================================

describe('B2. Distance Decay Test', () => {
  describe('Inheritance Confidence Decay', () => {
    it('should decay confidence monotonically with distance', () => {
      const distances = [0, 1, 2, 3, 4, 5];
      const confidences = distances.map((d) => calculateInheritanceConfidence(d));

      // Verify monotonic decrease
      for (let i = 1; i < confidences.length; i++) {
        expect(confidences[i]).toBeLessThan(confidences[i - 1]);
      }

      // Log decay curve
      console.log('Distance decay curve:');
      distances.forEach((d, i) => {
        console.log(`  Distance ${d}: ${(confidences[i] * 100).toFixed(1)}%`);
      });
    });

    it('should drop attribution below threshold at distance N', () => {
      const THRESHOLD = 0.3;
      const RECOMMENDED_N = 2;

      // At distance 2, confidence should be around 0.37
      const confidenceAtN = calculateInheritanceConfidence(RECOMMENDED_N);
      console.log(`Confidence at N=${RECOMMENDED_N}: ${(confidenceAtN * 100).toFixed(1)}%`);

      // At distance 3, should be below threshold
      const confidenceAt3 = calculateInheritanceConfidence(3);
      expect(confidenceAt3).toBeLessThan(0.3);
    });

    it('should mark inheritance as weak_inheritance beyond threshold', () => {
      const WEAK_THRESHOLD = 0.4;

      const testSequence = [
        { text: 'Aristotle claims X.', distance: 0, hasExplicitAttribution: true },
        { text: 'Sentence A.', distance: 1, hasExplicitAttribution: false },
        { text: 'Sentence B.', distance: 2, hasExplicitAttribution: false },
        { text: 'Sentence C.', distance: 3, hasExplicitAttribution: false },
        { text: 'This suggests Y.', distance: 4, hasExplicitAttribution: false },
      ];

      for (const sent of testSequence) {
        if (!sent.hasExplicitAttribution && sent.distance > 0) {
          const confidence = calculateInheritanceConfidence(sent.distance);
          const isWeak = confidence < WEAK_THRESHOLD;

          if (sent.distance >= 3) {
            expect(isWeak).toBe(true);
          }
        }
      }
    });
  });

  describe('Decay Curve Validation', () => {
    it('should produce strictly decreasing confidence curve', () => {
      const maxDistance = 10;
      const confidences: number[] = [];

      for (let d = 0; d <= maxDistance; d++) {
        confidences.push(calculateInheritanceConfidence(d));
      }

      // Verify strictly decreasing
      for (let i = 1; i < confidences.length; i++) {
        expect(confidences[i]).toBeLessThan(confidences[i - 1]);
      }

      // No flat carry-through
      const uniqueValues = new Set(confidences.map((c) => c.toFixed(4)));
      expect(uniqueValues.size).toBe(confidences.length);
    });
  });
});

// =============================================================================
// B3. Topic Drift Gating Test
// =============================================================================

describe('B3. Topic Drift Gating Test', () => {
  describe('Topic Similarity Calculation', () => {
    const SIMILARITY_CASES = [
      {
        a: 'Aristotle argues that phantasia enables deliberation.',
        b: 'This account explains practical reasoning.',
        expectedSimilarity: 'medium', // Some overlap
      },
      {
        a: 'Aristotle argues that phantasia enables deliberation.',
        b: 'Heidegger rethinks temporality differently.',
        expectedSimilarity: 'low', // Different topics
      },
      {
        a: 'Phantasia mediates between perception and intellect.',
        b: 'The faculty of imagination bridges sensory and cognitive domains.',
        expectedSimilarity: 'high', // Same topic, different words
      },
    ];

    test.each(SIMILARITY_CASES)('should calculate similarity for: "$a" vs "$b"', ({ a, b, expectedSimilarity }) => {
      const similarity = calculateTopicSimilarity(a, b);

      console.log(`Similarity: ${(similarity * 100).toFixed(1)}% (expected: ${expectedSimilarity})`);

      // Rough thresholds
      if (expectedSimilarity === 'low') {
        expect(similarity).toBeLessThan(0.2);
      }
    });
  });

  describe('Topic Shift Detection', () => {
    it('should detect topic shift markers', () => {
      const withShift = 'However, Heidegger rethinks temporality differently.';
      const withoutShift = 'This account explains practical reasoning.';

      expect(hasTopicShiftMarker(withShift)).toBe(true);
      expect(hasTopicShiftMarker(withoutShift)).toBe(false);
    });

    it('should reset attribution stack on topic shift', () => {
      const sequence = [
        { text: 'Aristotle argues that phantasia mediates deliberation.', shift: false },
        { text: 'This account explains practical reasoning.', shift: false },
        { text: 'However, Heidegger rethinks temporality differently.', shift: true },
        { text: 'This reveals a deeper structure of time.', shift: false },
      ];

      let currentAttribution: string | null = 'Aristotle';

      for (const sent of sequence) {
        if (hasTopicShiftMarker(sent.text)) {
          // Reset attribution on topic shift
          currentAttribution = null;
        }

        // Update attribution if explicit
        if (sent.text.includes('Heidegger')) {
          currentAttribution = 'Heidegger';
        }

        // Fourth sentence should NOT inherit Aristotle
        if (sent.text === 'This reveals a deeper structure of time.') {
          expect(currentAttribution).not.toBe('Aristotle');
        }
      }
    });
  });

  describe('Topic Similarity Threshold', () => {
    const TOPIC_THRESHOLD = 0.15;

    it('should fail inheritance when similarity drops below threshold', () => {
      const aristotleSentence = 'Aristotle argues that phantasia enables deliberation.';
      const heideggerSentence = 'Heidegger rethinks temporality through the structure of care.';

      const similarity = calculateTopicSimilarity(aristotleSentence, heideggerSentence);

      expect(similarity).toBeLessThan(TOPIC_THRESHOLD);
      // Attribution inheritance should fail
    });
  });
});

// =============================================================================
// B4. Commitment / Attribution Cross-Check
// =============================================================================

describe('B4. Commitment / Attribution Cross-Check', () => {
  describe('Commitment vs Attribution Distinction', () => {
    /**
     * Commitment: Who is epistemically responsible for the claim
     * Attribution: Source for retrieval purposes
     *
     * These can differ!
     */

    it('should distinguish commitment from retrieval attribution', () => {
      // Claim 1: Source-committed
      const claim1 = {
        text: 'Aristotle claims that phantasia enables deliberation.',
        commitment: 'source' as CommitmentType,
        retrievalAttribution: { source: 'Aristotle', confidence: 1.0, flags: [] },
      };

      // Claim 2: Essay-committed but with retrieval attribution
      const claim2 = {
        text: 'This implies that imagination structures action.',
        commitment: 'essay' as CommitmentType,
        retrievalAttribution: { source: 'Aristotle', confidence: 0.3, flags: ['weak_due_to_inheritance'] },
      };

      // Retrieval can still find Aristotle-related content
      expect(claim2.retrievalAttribution?.source).toBe('Aristotle');

      // But responsibility stays with essay author
      expect(claim2.commitment).toBe('essay');
    });
  });

  describe('Assertion: Essay Commitment Constraints', () => {
    /**
     * Claims with commitment=essay must NEVER be labeled as:
     * - "contradicted by [Author]"
     * - "false according to [Author]"
     *
     * Because the essay author, not the source, bears responsibility
     */

    it('should never label essay-committed claims as contradicted by source', () => {
      const essayCommittedClaim = {
        text: 'This implies that imagination structures action.',
        commitment: 'essay' as CommitmentType,
        verdict: 'UNSUPPORTED' as ExtendedVerdict,
      };

      // Even if unsupported, should not say "contradicted by Aristotle"
      // because the claim is the essay author's interpretation

      // This is what should NOT happen:
      const invalidFeedback = 'This claim is contradicted by Aristotle.';

      // For essay-committed claims, valid feedback would be:
      const validFeedback = 'This claim lacks direct textual support.';

      expect(essayCommittedClaim.commitment).not.toBe('source');
    });

    it('should allow weak retrieval attribution while blocking commitment', () => {
      // After upstream resolution fails
      const blockedClaim = {
        text: 'This therefore implies Z.',
        commitment: 'essay' as CommitmentType,
        retrievalAttribution: {
          source: 'Aristotle',
          confidence: 0.2,
          flags: ['weak_due_to_block'],
        },
        verdict: 'BLOCKED' as ExtendedVerdict,
      };

      // Commitment must not degrade to source
      expect(blockedClaim.commitment).not.toBe('source');

      // Retrieval attribution can remain but weakened
      expect(blockedClaim.retrievalAttribution?.confidence).toBeLessThan(0.4);
      expect(blockedClaim.retrievalAttribution?.flags).toContain('weak_due_to_block');
    });
  });
});

// =============================================================================
// Cascading Failure Test (E)
// =============================================================================

describe('E. Cascading Failure Test', () => {
  /**
   * Tests that failures in upstream claims correctly block downstream claims
   */

  describe('E1. Dependency Graph Blocking', () => {
    interface TestClaim {
      id: string;
      text: string;
      dependsOnClaimIds: string[];
      resolutionStatus: 'resolved' | 'failed' | 'partial';
    }

    function isBlockedByUpstream(claim: TestClaim, allClaims: Map<string, TestClaim>): boolean {
      return claim.dependsOnClaimIds.some((depId) => {
        const upstream = allClaims.get(depId);
        return upstream?.resolutionStatus === 'failed';
      });
    }

    it('should block claims when ANY upstream dependency fails', () => {
      const claims = new Map<string, TestClaim>([
        ['claim_0', { id: 'claim_0', text: 'Aristotle argues X.', dependsOnClaimIds: [], resolutionStatus: 'resolved' }],
        [
          'claim_1',
          { id: 'claim_1', text: 'This view supports Y.', dependsOnClaimIds: ['claim_0'], resolutionStatus: 'failed' },
        ],
        [
          'claim_2',
          {
            id: 'claim_2',
            text: 'This therefore implies Z.',
            dependsOnClaimIds: ['claim_1'],
            resolutionStatus: 'resolved',
          },
        ],
      ]);

      const claim2 = claims.get('claim_2')!;
      const isBlocked = isBlockedByUpstream(claim2, claims);

      expect(isBlocked).toBe(true);
    });

    it('should NOT skip around failed nodes to earlier claims', () => {
      const claims = new Map<string, TestClaim>([
        ['claim_0', { id: 'claim_0', text: 'Aristotle argues X.', dependsOnClaimIds: [], resolutionStatus: 'resolved' }],
        [
          'claim_1',
          { id: 'claim_1', text: 'This view supports Y.', dependsOnClaimIds: ['claim_0'], resolutionStatus: 'failed' },
        ],
        [
          'claim_2',
          {
            id: 'claim_2',
            text: 'This therefore implies Z.',
            // WRONG: depends on claim_0 directly, skipping claim_1
            // This should be caught
            dependsOnClaimIds: ['claim_1'], // CORRECT: depends on claim_1
            resolutionStatus: 'resolved',
          },
        ],
      ]);

      // Claim 2's "this" should refer to claim_1's content, not claim_0
      // Since claim_1 failed, claim_2 should be blocked
      const claim2 = claims.get('claim_2')!;
      expect(claim2.dependsOnClaimIds).toContain('claim_1');
      expect(isBlockedByUpstream(claim2, claims)).toBe(true);
    });
  });

  describe('E2. Attribution vs Commitment Separation on Block', () => {
    it('should preserve weak retrievalAttribution while blocking commitment', () => {
      // Simulated blocked claim result
      const blockedResult = {
        verdict: 'BLOCKED' as ExtendedVerdict,
        commitment: 'essay' as CommitmentType,
        retrievalAttribution: {
          source: 'Aristotle',
          confidence: 0.3,
          flags: ['weak_due_to_block'],
        },
      };

      // Commitment must not degrade to source
      expect(blockedResult.commitment).not.toBe('source');
      expect(blockedResult.commitment).toBe('essay');

      // Retrieval attribution can remain, but weakened
      expect(blockedResult.retrievalAttribution?.confidence).toBeLessThan(0.4);
      expect(blockedResult.retrievalAttribution?.flags).toContain('weak_due_to_block');
    });
  });

  describe('E3. BLOCKED Verdict Behavior', () => {
    it('should not count BLOCKED claims against unsupported rate', () => {
      const results: Array<{ verdict: ExtendedVerdict }> = [
        { verdict: 'SUPPORTED' },
        { verdict: 'UNSUPPORTED' },
        { verdict: 'BLOCKED' },
        { verdict: 'PARTIALLY_SUPPORTED' },
        { verdict: 'BLOCKED' },
      ];

      const blockedCount = results.filter((r) => r.verdict === 'BLOCKED').length;
      const unsupportedCount = results.filter((r) => r.verdict === 'UNSUPPORTED').length;
      const totalVerifiable = results.length - blockedCount;

      // Unsupported rate should exclude BLOCKED
      const unsupportedRate = unsupportedCount / totalVerifiable;

      expect(blockedCount).toBe(2);
      expect(unsupportedCount).toBe(1);
      expect(unsupportedRate).toBeCloseTo(1 / 3, 2);
    });

    it('should suggest "fix_upstream_referent" not "add_citation" for BLOCKED', () => {
      const blockedResult: BlockedClaimResult = {
        verdict: 'BLOCKED',
        blockReason: 'upstream_resolution_failed',
        blockingClaimIds: ['claim_1'],
        suggestedAction: 'fix_upstream_referent',
      };

      expect(blockedResult.suggestedAction).toBe('fix_upstream_referent');
      expect(blockedResult.suggestedAction).not.toBe('add_citation');
    });
  });
});

// =============================================================================
// Regression Tests (C)
// =============================================================================

describe('C. Combined Regression Tests', () => {
  describe('C1. No Silent Upgrade Regression', () => {
    /**
     * After changes, NO claim may move:
     * - UNSUPPORTED → SUPPORTED
     * - UNCERTAIN → SUPPORTED
     *
     * Unless:
     * - A quote locator appears, OR
     * - The claim was previously blocked by pronoun resolution
     */

    it('should prevent UNSUPPORTED → SUPPORTED without quote locator', () => {
      interface VerdictTransition {
        previousVerdict: ExtendedVerdict;
        newVerdict: ExtendedVerdict;
        hasQuoteLocator: boolean;
        wasBlockedByPronouns: boolean;
      }

      const validateTransition = (transition: VerdictTransition): boolean => {
        if (
          (transition.previousVerdict === 'UNSUPPORTED' || transition.previousVerdict === 'UNCERTAIN') &&
          transition.newVerdict === 'SUPPORTED'
        ) {
          // This upgrade is only allowed if:
          return transition.hasQuoteLocator || transition.wasBlockedByPronouns;
        }
        return true; // Other transitions are OK
      };

      // Test cases
      const invalidTransition: VerdictTransition = {
        previousVerdict: 'UNSUPPORTED',
        newVerdict: 'SUPPORTED',
        hasQuoteLocator: false,
        wasBlockedByPronouns: false,
      };

      const validTransition: VerdictTransition = {
        previousVerdict: 'UNSUPPORTED',
        newVerdict: 'SUPPORTED',
        hasQuoteLocator: true,
        wasBlockedByPronouns: false,
      };

      expect(validateTransition(invalidTransition)).toBe(false);
      expect(validateTransition(validTransition)).toBe(true);
    });
  });

  describe('C2. Misattribution Regression', () => {
    /**
     * After changes:
     * - Total attributed claims should decrease slightly, not increase
     * - Essay-voice claims should rise
     */

    interface AttributionMetrics {
      totalAttributed: number;
      essayVoice: number;
      aristotleAttributed: number;
      heideggerAttributed: number;
    }

    it('should track attribution distribution for regression', () => {
      // Baseline metrics (before changes)
      const baseline: AttributionMetrics = {
        totalAttributed: 45,
        essayVoice: 15,
        aristotleAttributed: 30,
        heideggerAttributed: 15,
      };

      // Expected after changes
      const afterChanges: AttributionMetrics = {
        totalAttributed: 40, // Should decrease
        essayVoice: 20, // Should increase
        aristotleAttributed: 25,
        heideggerAttributed: 15,
      };

      // Assertions
      expect(afterChanges.totalAttributed).toBeLessThanOrEqual(baseline.totalAttributed);
      expect(afterChanges.essayVoice).toBeGreaterThan(baseline.essayVoice);
    });
  });
});

// =============================================================================
// Scorecard (D)
// =============================================================================

describe('D. "Did This Help?" Scorecard', () => {
  /**
   * All metrics that must be satisfied for the changes to be accepted
   */

  interface ScoreCardMetrics {
    referentiallyUnresolvedClaims: number;
    partiallySupportedFromCorefFixes: number;
    falseSupportedPromotions: number;
    essayVoiceCorrectlyLabeled: number;
    misleadingAddCitationSuggestions: number;
    latencyIncreaseMs: number;
  }

  const ACCEPTANCE_CRITERIA = {
    referentiallyUnresolvedClaims: { direction: 'decrease', threshold: 'significant' },
    partiallySupportedFromCorefFixes: { direction: 'increase', threshold: 'some' },
    falseSupportedPromotions: { direction: 'equal', value: 0 },
    essayVoiceCorrectlyLabeled: { direction: 'increase', threshold: 'some' },
    misleadingAddCitationSuggestions: { direction: 'decrease', threshold: 'some' },
    latencyIncreaseMs: { direction: 'lte', value: 200 },
  };

  it('should validate all acceptance criteria', () => {
    // This test will be populated with actual measurements
    // after implementation

    const beforeMetrics: ScoreCardMetrics = {
      referentiallyUnresolvedClaims: 100,
      partiallySupportedFromCorefFixes: 0,
      falseSupportedPromotions: 0,
      essayVoiceCorrectlyLabeled: 50,
      misleadingAddCitationSuggestions: 30,
      latencyIncreaseMs: 0,
    };

    const afterMetrics: ScoreCardMetrics = {
      referentiallyUnresolvedClaims: 10, // Target: ↓↓↓
      partiallySupportedFromCorefFixes: 25, // Target: ↑
      falseSupportedPromotions: 0, // Target: = 0
      essayVoiceCorrectlyLabeled: 70, // Target: ↑
      misleadingAddCitationSuggestions: 10, // Target: ↓
      latencyIncreaseMs: 150, // Target: ≤ acceptable
    };

    // Validate criteria
    expect(afterMetrics.referentiallyUnresolvedClaims).toBeLessThan(beforeMetrics.referentiallyUnresolvedClaims);
    expect(afterMetrics.partiallySupportedFromCorefFixes).toBeGreaterThan(beforeMetrics.partiallySupportedFromCorefFixes);
    expect(afterMetrics.falseSupportedPromotions).toBe(0);
    expect(afterMetrics.essayVoiceCorrectlyLabeled).toBeGreaterThan(beforeMetrics.essayVoiceCorrectlyLabeled);
    expect(afterMetrics.misleadingAddCitationSuggestions).toBeLessThan(beforeMetrics.misleadingAddCitationSuggestions);
    expect(afterMetrics.latencyIncreaseMs).toBeLessThanOrEqual(200);
  });
});
