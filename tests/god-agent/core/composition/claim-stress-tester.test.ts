/**
 * Tests for ClaimStressTester — Warrant Adequacy, Contested Scholarship,
 * Contradiction Retrieval, and Remediation Suggestions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ClaimStressTester,
  type StressTesterConfig,
} from '../../../../src/god-agent/core/composition/claim-stress-tester.js';
import type {
  ClaimAtom,
  ClaimBinding,
  QuoteSpan,
  StressTestReport,
  AtomStressResult,
  StressRemediation,
} from '../../../../src/god-agent/core/composition/icp-types.js';
import type { ToulminClaim } from '../../../../src/god-agent/cli/composition/sir/claim-map.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeAtom(overrides: Partial<ClaimAtom> = {}): ClaimAtom {
  return {
    atom_id: 'atom-1',
    atom_version_id: 1,
    display_text: 'Aristotle defines phantasia as a movement resulting from sense perception.',
    semantic_text: 'Aristotle defines phantasia movement sense perception',
    modality: 'asserted',
    kind: 'corpus_claim',
    parent_claim_id: 'C1',
    evidence_mode: 'INFERENCE',
    bound_quote_ids: [],
    facet_id: 'facet-1',
    ...overrides,
  };
}

function makeBinding(overrides: Partial<ClaimBinding> = {}): ClaimBinding {
  return {
    binding_id: 'bind-1',
    claim_id: 'C1',
    atom_ids: ['atom-1'],
    quote_ids: ['q-1'],
    support_kind: 'DIRECT_QUOTE',
    staleness_status: 'current',
    ...overrides,
  };
}

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'q-1',
    text_fingerprint: 'fp-1',
    span_fingerprint: 'sfp-1',
    doc_id: 'doc-1',
    page: 42,
    source_kind: 'CORPUS',
    clean_text_range: [0, 100],
    clean_range_hash: 'hash-1',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Aristotle defines phantasia as a movement resulting from sense perception.',
    left_ctx_hash: 'lhash',
    right_ctx_hash: 'rhash',
    verification_status: 'auto_verified',
    provenance_scorecard: {
      fidelity_score: 0.9,
      ocr_risk_score: 0.1,
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: 1,
    },
    ...overrides,
  };
}

function makeClaim(overrides: Partial<ToulminClaim> = {}): ToulminClaim {
  return {
    id: 'C1',
    claim: 'Aristotle defines phantasia as a movement resulting from actual perception.',
    grounds: ['Aristotle argues phantasia arises only after sensation.'],
    warrant: 'Therefore phantasia is necessarily dependent on prior sense experience.',
    warrantGenerality: 0.7,
    completenessScore: 0.9,
    citations: [
      {
        key: 'Aristotle-DA:428a',
        author: 'Aristotle',
        year: -350,
        locator: '428a',
        fullCitation: 'Aristotle, De Anima III.3, 428a',
        isPrimary: true,
      },
    ],
    location: { sectionId: '1', paragraphIndex: 0 },
    quality: {
      toulminCompleteness: 0.9,
      warrantQuality: 0.7,
      evidenceStrength: 0.6,
      counterArgumentHandling: 0.8,
      overallScore: 0.75,
    },
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('ClaimStressTester', () => {
  let tester: ClaimStressTester;

  beforeEach(() => {
    tester = new ClaimStressTester();
  });

  // ===========================================================================
  // 1. Basic stress test
  // ===========================================================================

  describe('basic stressTest()', () => {
    it('should return a report with summary stats for tested atoms', async () => {
      const atom = makeAtom({ evidence_mode: 'DIRECT_QUOTE' });
      const binding = makeBinding({ atom_ids: [atom.atom_id] });
      const span = makeSpan();
      const claim = makeClaim();

      const report = await tester.stressTest([atom], [binding], [span], [claim]);

      expect(report.atom_results).toHaveLength(1);
      expect(report.summary.total_tested).toBe(1);
      expect(report.summary).toHaveProperty('passed');
      expect(report.summary).toHaveProperty('warned');
      expect(report.summary).toHaveProperty('failed');
      expect(report.summary).toHaveProperty('demoted');
    });

    it('should skip organization and stub atoms', async () => {
      const orgAtom = makeAtom({ atom_id: 'org-1', kind: 'organization' });
      const stubAtom = makeAtom({ atom_id: 'stub-1', kind: 'stub' });
      const realAtom = makeAtom({
        atom_id: 'real-1',
        kind: 'corpus_claim',
        evidence_mode: 'DIRECT_QUOTE',
      });
      const binding = makeBinding({ atom_ids: ['real-1'] });
      const claim = makeClaim();

      const report = await tester.stressTest(
        [orgAtom, stubAtom, realAtom],
        [binding],
        [],
        [claim],
      );

      expect(report.atom_results).toHaveLength(1);
      expect(report.atom_results[0].atom_id).toBe('real-1');
      expect(report.summary.total_tested).toBe(1);
    });
  });

  // ===========================================================================
  // 2. Warrant adequacy
  // ===========================================================================

  describe('warrant adequacy', () => {
    it('should mark DIRECT_QUOTE atom as adequate when current binding exists', async () => {
      const atom = makeAtom({ evidence_mode: 'DIRECT_QUOTE' });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        staleness_status: 'current',
      });

      const report = await tester.stressTest([atom], [binding], [], [makeClaim()]);

      expect(report.atom_results[0].warrant_verdict).toBe('adequate');
    });

    it('should mark DIRECT_QUOTE atom as missing when no current binding exists', async () => {
      const atom = makeAtom({ evidence_mode: 'DIRECT_QUOTE' });
      // Binding exists but is stale
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        staleness_status: 'stale',
      });

      const report = await tester.stressTest([atom], [binding], [], [makeClaim()]);

      expect(report.atom_results[0].warrant_verdict).toBe('missing');
    });

    it('should mark INFERENCE atom without parent claim warrant as missing', async () => {
      const atom = makeAtom({ evidence_mode: 'INFERENCE', parent_claim_id: 'C2' });
      // No claim with id C2 exists in claims array
      const claim = makeClaim({ id: 'C1' });

      const report = await tester.stressTest([atom], [], [], [claim]);

      expect(report.atom_results[0].warrant_verdict).toBe('missing');
    });

    it('should mark INFERENCE atom as weak when parent claim warrant generality is below threshold', async () => {
      const atom = makeAtom({ evidence_mode: 'INFERENCE', parent_claim_id: 'C1' });
      // Warrant exists but generality is below default threshold of 0.6
      const claim = makeClaim({ id: 'C1', warrantGenerality: 0.4 });
      const binding = makeBinding({ atom_ids: [atom.atom_id] });

      const report = await tester.stressTest([atom], [binding], [], [claim]);

      expect(report.atom_results[0].warrant_verdict).toBe('weak');
    });

    it('should mark INFERENCE atom as adequate when warrant is present and strong', async () => {
      const atom = makeAtom({ evidence_mode: 'INFERENCE', parent_claim_id: 'C1' });
      const claim = makeClaim({ id: 'C1', warrantGenerality: 0.8 });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        staleness_status: 'current',
      });

      const report = await tester.stressTest([atom], [binding], [], [claim]);

      expect(report.atom_results[0].warrant_verdict).toBe('adequate');
    });

    it('should mark NO_EVIDENCE_REQUIRED atom as adequate regardless of bindings', async () => {
      const atom = makeAtom({ evidence_mode: 'NO_EVIDENCE_REQUIRED' });

      const report = await tester.stressTest([atom], [], [], [makeClaim()]);

      expect(report.atom_results[0].warrant_verdict).toBe('adequate');
    });
  });

  // ===========================================================================
  // 3. Contested scholarship detection
  // ===========================================================================

  describe('contested scholarship', () => {
    it('should detect contested scholarship when spans from different docs contain contradiction markers', async () => {
      const atom = makeAtom({
        semantic_text: 'phantasia defines movement perception',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });
      // Two spans from different documents with overlapping terms and contradiction markers
      const span1 = makeSpan({
        quote_id: 'q-1',
        doc_id: 'doc-1',
        text: 'phantasia defines movement as arising from perception naturally',
      });
      const span2 = makeSpan({
        quote_id: 'q-2',
        doc_id: 'doc-2',
        text: 'however phantasia is not movement but rather a distinct faculty of perception',
      });

      const report = await tester.stressTest([atom], [], [span1, span2], [makeClaim()]);

      expect(report.atom_results[0].contested).toBe(true);
    });

    it('should not flag contested when spans come from the same document', async () => {
      const atom = makeAtom({
        semantic_text: 'phantasia defines movement perception',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });
      const span1 = makeSpan({
        quote_id: 'q-1',
        doc_id: 'doc-1',
        text: 'phantasia defines movement as arising from perception naturally',
      });
      const span2 = makeSpan({
        quote_id: 'q-2',
        doc_id: 'doc-1', // Same doc
        text: 'however phantasia is not movement but rather a distinct perception',
      });

      const report = await tester.stressTest([atom], [], [span1, span2], [makeClaim()]);

      expect(report.atom_results[0].contested).toBe(false);
    });

    it('should not flag contested when fewer than 2 relevant spans exist', async () => {
      const atom = makeAtom({
        semantic_text: 'phantasia defines movement perception',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });
      const span = makeSpan({
        quote_id: 'q-1',
        doc_id: 'doc-1',
        text: 'phantasia defines movement',
      });

      const report = await tester.stressTest([atom], [], [span], [makeClaim()]);

      expect(report.atom_results[0].contested).toBe(false);
    });
  });

  // ===========================================================================
  // 4. Remediation suggestions
  // ===========================================================================

  describe('remediation suggestions', () => {
    it('should suggest demote and request_more_evidence when warrant is missing', async () => {
      const atom = makeAtom({
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'C-missing',
        facet_id: 'facet-1',
      });

      const report = await tester.stressTest([atom], [], [], [makeClaim()]);
      const result = report.atom_results[0];

      expect(result.warrant_verdict).toBe('missing');
      const remTypes = result.remediations.map(r => r.type);
      expect(remTypes).toContain('demote');
      expect(remTypes).toContain('request_more_evidence');

      const requestRem = result.remediations.find(r => r.type === 'request_more_evidence');
      expect(requestRem).toBeDefined();
      if (requestRem && requestRem.type === 'request_more_evidence') {
        expect(requestRem.facet_id).toBe('facet-1');
      }
    });

    it('should suggest qualify when warrant is weak', async () => {
      const atom = makeAtom({
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'C1',
      });
      const claim = makeClaim({ warrantGenerality: 0.3 });
      const binding = makeBinding({ atom_ids: [atom.atom_id] });

      const report = await tester.stressTest([atom], [binding], [], [claim]);
      const result = report.atom_results[0];

      expect(result.warrant_verdict).toBe('weak');
      const remTypes = result.remediations.map(r => r.type);
      expect(remTypes).toContain('qualify');

      const qualifyRem = result.remediations.find(r => r.type === 'qualify');
      if (qualifyRem && qualifyRem.type === 'qualify') {
        expect(qualifyRem.suggested_modality).toBe('hedged');
      }
    });

    it('should suggest add_rebuttal when contested', async () => {
      const atom = makeAtom({
        semantic_text: 'phantasia defines movement perception',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });
      const span1 = makeSpan({
        quote_id: 'q-1',
        doc_id: 'doc-1',
        text: 'phantasia defines movement as arising from perception naturally',
      });
      const span2 = makeSpan({
        quote_id: 'q-2',
        doc_id: 'doc-2',
        text: 'however phantasia is not movement but rather a distinct perception faculty',
      });

      const report = await tester.stressTest([atom], [], [span1, span2], [makeClaim()]);
      const result = report.atom_results[0];

      expect(result.contested).toBe(true);
      const remTypes = result.remediations.map(r => r.type);
      expect(remTypes).toContain('add_rebuttal');
    });

    it('should have no remediations when atom is adequate and uncontested', async () => {
      const atom = makeAtom({ evidence_mode: 'NO_EVIDENCE_REQUIRED' });

      const report = await tester.stressTest([atom], [], [], [makeClaim()]);
      const result = report.atom_results[0];

      expect(result.warrant_verdict).toBe('adequate');
      expect(result.contested).toBe(false);
      expect(result.remediations).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 5. Empty atoms
  // ===========================================================================

  describe('empty atoms', () => {
    it('should return empty results for empty atoms array', async () => {
      const report = await tester.stressTest([], [], [], []);

      expect(report.atom_results).toHaveLength(0);
      expect(report.summary.total_tested).toBe(0);
      expect(report.summary.passed).toBe(0);
      expect(report.summary.warned).toBe(0);
      expect(report.summary.failed).toBe(0);
      expect(report.summary.demoted).toBe(0);
    });
  });

  // ===========================================================================
  // 6. Demote flow — summary stats
  // ===========================================================================

  describe('demote flow in summary', () => {
    it('should count demoted atoms in summary when remediation includes demote', async () => {
      // Two INFERENCE atoms with missing parent claims => both get demote remediation
      const atom1 = makeAtom({
        atom_id: 'atom-1',
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'missing-1',
      });
      const atom2 = makeAtom({
        atom_id: 'atom-2',
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'missing-2',
      });

      const report = await tester.stressTest([atom1, atom2], [], [], []);

      expect(report.summary.demoted).toBe(2);
      expect(report.summary.failed).toBe(2);
    });
  });

  // ===========================================================================
  // 7. Multiple atoms with mixed verdicts
  // ===========================================================================

  describe('multiple atoms with mixed verdicts', () => {
    it('should produce correct summary stats for mixed results', async () => {
      const atomOk = makeAtom({
        atom_id: 'atom-ok',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });
      const atomWeak = makeAtom({
        atom_id: 'atom-weak',
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'C1',
      });
      const atomFail = makeAtom({
        atom_id: 'atom-fail',
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'nonexistent',
      });

      const claim = makeClaim({ id: 'C1', warrantGenerality: 0.3 });
      const binding = makeBinding({ atom_ids: ['atom-weak'] });

      const report = await tester.stressTest(
        [atomOk, atomWeak, atomFail],
        [binding],
        [],
        [claim],
      );

      expect(report.summary.total_tested).toBe(3);
      expect(report.summary.passed).toBe(1); // atom-ok (adequate + not contested)
      expect(report.summary.warned).toBe(1); // atom-weak (weak warrant)
      expect(report.summary.failed).toBe(1); // atom-fail (missing)
    });
  });

  // ===========================================================================
  // 8. Custom configuration thresholds
  // ===========================================================================

  describe('custom configuration', () => {
    it('should respect custom warrantAdequacyThreshold', async () => {
      // With high threshold, a 0.7 warrant generality becomes weak
      const highThresholdTester = new ClaimStressTester({
        warrantAdequacyThreshold: 0.9,
      });

      const atom = makeAtom({
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'C1',
      });
      const claim = makeClaim({ warrantGenerality: 0.7 });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        staleness_status: 'current',
      });

      const report = await highThresholdTester.stressTest(
        [atom],
        [binding],
        [],
        [claim],
      );

      expect(report.atom_results[0].warrant_verdict).toBe('weak');
    });

    it('should mark as adequate when warrantGenerality meets the custom threshold', async () => {
      const lowThresholdTester = new ClaimStressTester({
        warrantAdequacyThreshold: 0.3,
      });

      const atom = makeAtom({
        evidence_mode: 'INFERENCE',
        parent_claim_id: 'C1',
      });
      const claim = makeClaim({ warrantGenerality: 0.4 });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        staleness_status: 'current',
      });

      const report = await lowThresholdTester.stressTest(
        [atom],
        [binding],
        [],
        [claim],
      );

      expect(report.atom_results[0].warrant_verdict).toBe('adequate');
    });
  });

  // ===========================================================================
  // 9. Contradiction retrieval with mock retrieval layer
  // ===========================================================================

  describe('contradiction retrieval', () => {
    it('should add fragility warning and acknowledge_contradiction remediation when retrieval finds contradictions', async () => {
      const mockRetrieval = {
        retrieveContext: vi.fn().mockResolvedValue([
          {
            content: 'This view rejects the idea that phantasia defines movement perception in the soul',
          },
        ]),
      } as any;

      const testerWithRetrieval = new ClaimStressTester({}, mockRetrieval);

      const atom = makeAtom({
        semantic_text: 'phantasia defines movement perception',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });

      const report = await testerWithRetrieval.stressTest(
        [atom],
        [],
        [],
        [makeClaim()],
      );

      const result = report.atom_results[0];
      expect(result.fragility_warning).toBeDefined();
      expect(result.fragility_warning).toContain('contradictory');
      const remTypes = result.remediations.map(r => r.type);
      expect(remTypes).toContain('acknowledge_contradiction');
    });

    it('should not add fragility warning when retrieval returns no contradictions', async () => {
      const mockRetrieval = {
        retrieveContext: vi.fn().mockResolvedValue([]),
      } as any;

      const testerWithRetrieval = new ClaimStressTester({}, mockRetrieval);
      const atom = makeAtom({ evidence_mode: 'NO_EVIDENCE_REQUIRED' });

      const report = await testerWithRetrieval.stressTest(
        [atom],
        [],
        [],
        [makeClaim()],
      );

      expect(report.atom_results[0].fragility_warning).toBeUndefined();
    });

    it('should handle retrieval errors gracefully without fragility warning', async () => {
      const mockRetrieval = {
        retrieveContext: vi.fn().mockRejectedValue(new Error('retrieval down')),
      } as any;

      const testerWithRetrieval = new ClaimStressTester({}, mockRetrieval);
      const atom = makeAtom({ evidence_mode: 'NO_EVIDENCE_REQUIRED' });

      const report = await testerWithRetrieval.stressTest(
        [atom],
        [],
        [],
        [makeClaim()],
      );

      expect(report.atom_results[0].fragility_warning).toBeUndefined();
    });
  });

  // ===========================================================================
  // 10. PARAPHRASE_SUPPORTED evidence mode
  // ===========================================================================

  describe('PARAPHRASE_SUPPORTED evidence mode', () => {
    it('should be adequate with a current binding', async () => {
      const atom = makeAtom({ evidence_mode: 'PARAPHRASE_SUPPORTED' });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        staleness_status: 'current',
      });

      const report = await tester.stressTest([atom], [binding], [], [makeClaim()]);

      expect(report.atom_results[0].warrant_verdict).toBe('adequate');
    });

    it('should be missing without a current binding', async () => {
      const atom = makeAtom({ evidence_mode: 'PARAPHRASE_SUPPORTED' });

      const report = await tester.stressTest([atom], [], [], [makeClaim()]);

      expect(report.atom_results[0].warrant_verdict).toBe('missing');
    });
  });
});
