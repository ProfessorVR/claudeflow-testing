/**
 * Claim Stress Tester — MVP Warrant Adequacy + Contradiction Retrieval
 *
 * MVP scope:
 *   - Warrant adequacy check for INFERENCE claims (reuses ClaimVerifier 4-class verdicts)
 *   - Contested scholarship alert via corpus overlap analysis
 *   - Adversarial "Red Teamer" via contradiction retrieval
 *   - Structured demotion → HypothesisClaim[]
 *
 * Phase 2 (deferred): counter-reading generation, ambiguity detection
 *
 * @module claim-stress-tester
 */

import type {
  ClaimAtom,
  ClaimBinding,
  QuoteSpan,
  StressTestReport,
  AtomStressResult,
  StressRemediation,
  HypothesisClaim,
  Facet,
} from './icp-types.js';
import type { ToulminClaim } from '../../cli/composition/sir/claim-map.js';
import type { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface StressTesterConfig {
  /** Minimum warrant quality for INFERENCE atoms (0-1) */
  warrantAdequacyThreshold?: number;
  /** Minimum contradictory relevance to trigger fragility warning */
  contradictionThreshold?: number;
  /** Max retrieval results for contradiction search */
  maxContradictionResults?: number;
}

const DEFAULT_CONFIG: Required<StressTesterConfig> = {
  warrantAdequacyThreshold: 0.6,
  contradictionThreshold: 0.7,
  maxContradictionResults: 5,
};

// =============================================================================
// CLAIM STRESS TESTER
// =============================================================================

export class ClaimStressTester {
  private readonly config: Required<StressTesterConfig>;
  private readonly retrieval?: SmartRetrievalLayer;

  constructor(
    config: StressTesterConfig = {},
    retrieval?: SmartRetrievalLayer,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.retrieval = retrieval;
  }

  /**
   * Run stress tests on all atoms.
   */
  async stressTest(
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
    spans: QuoteSpan[],
    claims: ToulminClaim[],
  ): Promise<StressTestReport> {
    const results: AtomStressResult[] = [];

    for (const atom of atoms) {
      if (atom.kind === 'organization' || atom.kind === 'stub') {
        continue; // Skip organizational atoms
      }

      const result = await this.testAtom(atom, bindings, spans, claims);
      results.push(result);
    }

    const summary = {
      total_tested: results.length,
      passed: results.filter(r => r.warrant_verdict === 'adequate' && !r.contested).length,
      warned: results.filter(r => r.warrant_verdict === 'weak' || r.contested).length,
      failed: results.filter(r => r.warrant_verdict === 'missing').length,
      demoted: results.filter(r =>
        r.remediations.some(rem => rem.type === 'demote'),
      ).length,
    };

    return { atom_results: results, summary };
  }

  /**
   * Test a single atom.
   */
  private async testAtom(
    atom: ClaimAtom,
    bindings: ClaimBinding[],
    spans: QuoteSpan[],
    claims: ToulminClaim[],
  ): Promise<AtomStressResult> {
    const remediations: StressRemediation[] = [];

    // 1. Warrant adequacy check (for INFERENCE atoms)
    const warrantVerdict = this.checkWarrantAdequacy(atom, bindings, claims);

    // 2. Contested scholarship alert
    const contested = this.checkContestedScholarship(atom, spans);

    // 3. Contradiction retrieval (Red Teamer)
    let fragilityWarning: string | undefined;
    if (this.retrieval) {
      fragilityWarning = await this.runContradictionRetrieval(atom);
    }

    // Build remediation suggestions
    if (warrantVerdict === 'missing') {
      remediations.push({ type: 'demote' });
      remediations.push({
        type: 'request_more_evidence',
        facet_id: atom.facet_id,
      });
    } else if (warrantVerdict === 'weak') {
      remediations.push({
        type: 'qualify',
        suggested_modality: 'hedged',
      });
    }

    if (contested) {
      remediations.push({
        type: 'add_rebuttal',
        contra_evidence: 'Corpus contains contradictory scholarship',
      });
    }

    if (fragilityWarning) {
      remediations.push({
        type: 'acknowledge_contradiction',
        contra_quote_id: 'auto-detected',
      });
    }

    return {
      atom_id: atom.atom_id,
      warrant_verdict: warrantVerdict,
      contested,
      fragility_warning: fragilityWarning,
      remediations,
    };
  }

  /**
   * Check warrant adequacy for an atom.
   * For INFERENCE atoms: needs explicit warrant in parent claim.
   * For DIRECT_QUOTE/PARAPHRASE: inherently supported by evidence.
   */
  private checkWarrantAdequacy(
    atom: ClaimAtom,
    bindings: ClaimBinding[],
    claims: ToulminClaim[],
  ): 'adequate' | 'weak' | 'missing' {
    // Direct quotes and paraphrases are inherently supported
    if (atom.evidence_mode === 'DIRECT_QUOTE' || atom.evidence_mode === 'PARAPHRASE_SUPPORTED') {
      // Check that at least one binding exists
      const hasBinding = bindings.some(
        b => b.atom_ids.includes(atom.atom_id) && b.staleness_status === 'current',
      );
      return hasBinding ? 'adequate' : 'missing';
    }

    // No evidence required → adequate
    if (atom.evidence_mode === 'NO_EVIDENCE_REQUIRED') {
      return 'adequate';
    }

    // INFERENCE atoms: check parent claim's warrant
    const parentClaim = claims.find(c => c.id === atom.parent_claim_id);
    if (!parentClaim) return 'missing';

    if (!parentClaim.warrant) return 'missing';
    if (parentClaim.warrantGenerality < this.config.warrantAdequacyThreshold) return 'weak';

    // Check if bindings exist
    const hasBinding = bindings.some(
      b => b.atom_ids.includes(atom.atom_id) && b.staleness_status === 'current',
    );
    if (!hasBinding) return 'weak';

    return 'adequate';
  }

  /**
   * Check for contested scholarship — multiple spans disagree.
   */
  private checkContestedScholarship(
    atom: ClaimAtom,
    spans: QuoteSpan[],
  ): boolean {
    // Look for spans that might contradict this atom
    const atomTerms = new Set(
      atom.semantic_text.split(/\s+/).filter(w => w.length > 3),
    );

    // Find relevant spans
    const relevant = spans.filter(span => {
      const spanTerms = span.text.toLowerCase().split(/\s+/);
      const overlap = spanTerms.filter(t => atomTerms.has(t)).length;
      return overlap >= 2; // At least 2 shared terms
    });

    if (relevant.length < 2) return false;

    // Check if relevant spans come from different documents (potential disagreement)
    const docs = new Set(relevant.map(s => s.doc_id));
    if (docs.size < 2) return false;

    // Heuristic: check for negation/contradiction markers
    const contradictionMarkers = /\b(not|never|contrary|disagrees?|rejects?|opposes?|unlike|however|but\s+rather)\b/i;
    const hasContradiction = relevant.some(s => contradictionMarkers.test(s.text));

    return hasContradiction;
  }

  /**
   * Adversarial contradiction retrieval — search for evidence that
   * contradicts the atom's semantic text.
   */
  private async runContradictionRetrieval(
    atom: ClaimAtom,
  ): Promise<string | undefined> {
    if (!this.retrieval) return undefined;

    // Build negation query
    const negationQuery = `evidence that contradicts: ${atom.semantic_text}`;

    try {
      const chunks = await this.retrieval.retrieveContext(negationQuery, {
        maxChunks: this.config.maxContradictionResults,
        minRelevance: this.config.contradictionThreshold,
      });

      if (chunks.length > 0) {
        // Check if any chunk actually contradicts (heuristic)
        const contradicting = chunks.filter(chunk => {
          const content = chunk.content.toLowerCase();
          const hasNegation = /\b(not|never|contrary|rejects?|denies?|opposes?)\b/.test(content);
          // Must also share terms with the atom
          const atomTerms = atom.semantic_text.split(/\s+/).filter(w => w.length > 3);
          const termOverlap = atomTerms.filter(t => content.includes(t.toLowerCase())).length;
          return hasNegation && termOverlap >= 2;
        });

        if (contradicting.length > 0) {
          return `Found ${contradicting.length} potentially contradictory passage(s) in corpus: "${contradicting[0].content.slice(0, 100)}..."`;
        }
      }
    } catch {
      // Retrieval failure — skip silently
    }

    return undefined;
  }
}
