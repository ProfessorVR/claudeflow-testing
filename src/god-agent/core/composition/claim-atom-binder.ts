/**
 * Claim Atom Binder — Atom Decomposition + Binding + Budget Pruning
 *
 * Pipeline:
 *   1. Decompose each ToulminClaim into ClaimAtom[] (with modality/kind tagging)
 *   2. Bind atoms to QuoteSpans → ClaimBinding[] at atom granularity
 *   3. Enforce budget on unbound/redundant bindings (post-binding)
 *   4. Demote atoms without evidence → HypothesisClaim[]
 *
 * HARD INVARIANT: never prune the last binding that satisfies a strict facet threshold.
 *
 * @module claim-atom-binder
 */

import { randomUUID } from 'crypto';
import type {
  ClaimAtom,
  ClaimBinding,
  QuoteSpan,
  Facet,
  HypothesisClaim,
  SupportKind,
  AtomModality,
  AtomKind,
  EvidenceMode,
  EvidenceStrictness,
  SourceAdmissionPolicy,
  VerificationStatus,
  BlockReason,
  AtomMigration,
  AtomMigrationType,
} from './icp-types.js';
import {
  defaultEvidenceMode,
  VERIFIED_STATUSES,
} from './icp-types.js';
import type { ToulminClaim } from '../../cli/composition/sir/claim-map.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface ClaimAtomBinderConfig {
  /** Default atoms mode */
  defaultAtomsMode?: 'off' | 'analytics' | 'strict';
}

// =============================================================================
// DECOMPOSITION RESULT
// =============================================================================

export interface DecompositionResult {
  atoms: ClaimAtom[];
  /** Warnings from decomposition */
  warnings: string[];
}

// =============================================================================
// BINDING RESULT
// =============================================================================

export interface BindingResult {
  bindings: ClaimBinding[];
  /** Atoms that could not be bound (candidates for demotion) */
  unbound_atoms: ClaimAtom[];
  /** Block reasons for failed bindings */
  block_reasons: BlockReason[];
}

// =============================================================================
// CLAIM ATOM BINDER
// =============================================================================

export class ClaimAtomBinder {
  /**
   * Decompose ToulminClaims into ClaimAtoms.
   * Each claim becomes multiple atomic propositions.
   */
  decompose(
    claims: ToulminClaim[],
    facetId: string,
  ): DecompositionResult {
    const atoms: ClaimAtom[] = [];
    const warnings: string[] = [];

    for (const claim of claims) {
      const claimAtoms = this.decomposeClaimToAtoms(claim, facetId);
      atoms.push(...claimAtoms);
    }

    // Check for potential issues
    if (atoms.length === 0) {
      warnings.push('No atoms extracted from claims');
    }

    return { atoms, warnings };
  }

  /**
   * Bind atoms to QuoteSpans, creating ClaimBindings.
   * Applies eligible-phase SourceAdmissionPolicy enforcement.
   */
  bind(
    atoms: ClaimAtom[],
    spans: QuoteSpan[],
    facets: Facet[],
    admissionPolicy?: SourceAdmissionPolicy,
  ): BindingResult {
    const bindings: ClaimBinding[] = [];
    const unboundAtoms: ClaimAtom[] = [];
    const blockReasons: BlockReason[] = [];

    // Filter spans to only eligible ones (Phase 2 admission)
    const eligibleSpans = admissionPolicy
      ? this.applyEligibleAdmission(spans, facets, admissionPolicy)
      : spans.filter(s => VERIFIED_STATUSES.has(s.verification_status));

    for (const atom of atoms) {
      if (atom.evidence_mode === 'NO_EVIDENCE_REQUIRED') {
        // No binding needed
        continue;
      }

      // Find matching quotes for this atom
      const candidates = this.findCandidateQuotes(atom, eligibleSpans);

      if (candidates.length === 0) {
        unboundAtoms.push(atom);

        // Determine facet strictness
        const facet = facets.find(f => f.facet_id === atom.facet_id);
        const strictness = facet?.strictness_override ?? 'strict';

        if (strictness === 'strict') {
          blockReasons.push({
            action: 'bind',
            facet_id: atom.facet_id,
            rule_id: 'strict_evidence_required',
            required_state: `At least 1 verified quote for atom "${atom.display_text}"`,
            observed_state: '0 eligible quotes found',
            minimal_remediations: [
              'Retrieve more evidence for this facet',
              'Verify an existing quote',
              'Relax facet to moderate strictness',
              'Reclassify atom as interpretive_move or authorial_stipulation',
            ],
          });
        }
        continue;
      }

      // Create binding with best candidate(s)
      const supportKind = this.determineSupportKind(atom, candidates[0]);
      const binding: ClaimBinding = {
        binding_id: randomUUID(),
        claim_id: atom.parent_claim_id,
        atom_ids: [atom.atom_id],
        quote_ids: candidates.map(c => c.quote_id),
        support_kind: supportKind,
        staleness_status: 'current',
      };

      // Cross-author tension check: if bound spans come from different authors
      // with contrasts_with edges, annotate the binding with a tension warning.
      // This informs Stage 8a's preventive coherence injection.
      const boundAuthors = new Set(
        candidates.map(c => (c.source_anchor || '').split(' - ')[0].replace(/\s*\(bridge-enforced\)/, '').trim()).filter(Boolean)
      );
      if (boundAuthors.size > 1) {
        (binding as any).cross_author_tension = true;
        (binding as any).bound_authors = [...boundAuthors];
      }

      bindings.push(binding);
      atom.bound_quote_ids = candidates.map(c => c.quote_id);
    }

    return {
      bindings,
      unbound_atoms: unboundAtoms,
      block_reasons: blockReasons,
    };
  }

  /**
   * Demote unbound atoms to hypothesis claims.
   */
  demoteToHypothesis(
    unboundAtoms: ClaimAtom[],
    originalClaims: ToulminClaim[],
    existingBindings: ClaimBinding[],
  ): HypothesisClaim[] {
    const hypotheses: HypothesisClaim[] = [];

    // Group unbound atoms by parent claim
    const atomsByClaimId = new Map<string, ClaimAtom[]>();
    for (const atom of unboundAtoms) {
      if (!atomsByClaimId.has(atom.parent_claim_id)) {
        atomsByClaimId.set(atom.parent_claim_id, []);
      }
      atomsByClaimId.get(atom.parent_claim_id)!.push(atom);
    }

    for (const [claimId, atoms] of atomsByClaimId) {
      const claim = originalClaims.find(c => c.id === claimId);
      if (!claim) continue;

      // Get existing bindings for this claim (if any remain)
      const claimBindings = existingBindings.filter(b => b.claim_id === claimId);

      hypotheses.push({
        claim_id: claimId,
        original_claim: claim,
        atoms,
        demotion_reason: `Unbound atoms: ${atoms.map(a => a.display_text).join('; ')}`,
        demotion_timestamp: new Date().toISOString(),
        source_bindings: claimBindings,
      });
    }

    return hypotheses;
  }

  /**
   * Create an atom migration record.
   */
  createMigration(
    oldAtomId: string,
    newAtomId: string,
    type: AtomMigrationType,
    opts?: { mergedFrom?: string[]; splitInto?: string[] },
  ): AtomMigration {
    return {
      migration_id: randomUUID(),
      old_atom_id: oldAtomId,
      new_atom_id: newAtomId,
      type,
      timestamp: new Date().toISOString(),
      merged_from: opts?.mergedFrom,
      split_into: opts?.splitInto,
    };
  }

  /**
   * Rewrite references after an atom migration.
   * Updates bindings, paragraph plans, and sentence scopes.
   */
  rewriteReferences(
    migration: AtomMigration,
    bindings: ClaimBinding[],
    atomIds: string[][],
  ): void {
    if (migration.type === 'replace' || migration.type === 'edit_in_place') {
      // Simple rewrite: old → new
      for (const binding of bindings) {
        binding.atom_ids = binding.atom_ids.map(
          id => id === migration.old_atom_id ? migration.new_atom_id : id,
        );
      }
      for (const ids of atomIds) {
        for (let i = 0; i < ids.length; i++) {
          if (ids[i] === migration.old_atom_id) {
            ids[i] = migration.new_atom_id;
          }
        }
      }
    } else if (migration.type === 'merge' && migration.merged_from) {
      // Merge: all old → new
      const oldIds = new Set(migration.merged_from);
      for (const binding of bindings) {
        binding.atom_ids = binding.atom_ids.map(
          id => oldIds.has(id) ? migration.new_atom_id : id,
        );
        // Deduplicate
        binding.atom_ids = [...new Set(binding.atom_ids)];
      }
    }
    // Split requires interactive resolution (UI wizard)
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Decompose a single ToulminClaim into ClaimAtoms.
   */
  private decomposeClaimToAtoms(
    claim: ToulminClaim,
    facetId: string,
  ): ClaimAtom[] {
    const atoms: ClaimAtom[] = [];

    // Main claim → asserted atom
    atoms.push(this.createAtom(
      claim.claim,
      'asserted',
      'corpus_claim',
      claim.id,
      facetId,
    ));

    // Each ground → separate atom
    for (const ground of claim.grounds) {
      const modality = this.inferModality(ground);
      const kind = this.inferKind(ground);
      atoms.push(this.createAtom(ground, modality, kind, claim.id, facetId));
    }

    // Warrant → interpretive atom
    if (claim.warrant) {
      atoms.push(this.createAtom(
        claim.warrant,
        'inferential',
        'interpretive_move',
        claim.id,
        facetId,
      ));
    }

    // Qualification → hedged atom
    if (claim.qualification) {
      atoms.push(this.createAtom(
        claim.qualification,
        'hedged',
        'interpretive_move',
        claim.id,
        facetId,
      ));
    }

    return atoms;
  }

  /**
   * Create a ClaimAtom with proper defaults.
   */
  private createAtom(
    text: string,
    modality: AtomModality,
    kind: AtomKind,
    parentClaimId: string,
    facetId: string,
  ): ClaimAtom {
    return {
      atom_id: randomUUID(),
      atom_version_id: 1,
      display_text: text,
      semantic_text: text.toLowerCase().trim(),
      modality,
      kind,
      parent_claim_id: parentClaimId,
      evidence_mode: defaultEvidenceMode(kind),
      bound_quote_ids: [],
      facet_id: facetId,
    };
  }

  /**
   * Infer modality from text content.
   */
  private inferModality(text: string): AtomModality {
    const lower = text.toLowerCase();
    if (/\b(defines?|means?|denotes?|is\s+defined\s+as)\b/.test(lower)) return 'definitional';
    if (/\b(argues?|claims?|maintains?|suggests?|proposes?)\b/.test(lower)) return 'asserted';
    if (/\b(perhaps|possibly|might|may|could)\b/.test(lower)) return 'hedged';
    if (/\b(therefore|thus|hence|it\s+follows)\b/.test(lower)) return 'inferential';
    if (/\b(historically|in\s+the\s+\w+\s+century|ancient)\b/.test(lower)) return 'historical';
    return 'asserted';
  }

  /**
   * Infer kind from text content.
   */
  private inferKind(text: string): AtomKind {
    const lower = text.toLowerCase();
    if (/\b(by\s+['"]|i\s+mean|i\s+define|i\s+use\s+the\s+term)\b/.test(lower)) return 'authorial_stipulation';
    if (/\b(i\s+will|i\s+bracket|i\s+treat|my\s+method)\b/.test(lower)) return 'method';
    if (/\b(this\s+section|in\s+what\s+follows|proceeds?\s+in)\b/.test(lower)) return 'organization';
    return 'corpus_claim';
  }

  /**
   * Find candidate quotes for an atom using text similarity.
   */
  private findCandidateQuotes(
    atom: ClaimAtom,
    eligibleSpans: QuoteSpan[],
  ): QuoteSpan[] {
    const atomTerms = new Set(
      atom.semantic_text.split(/\s+/).filter(w => w.length > 3),
    );

    const scored = eligibleSpans.map(span => {
      const spanTerms = new Set(
        span.text.toLowerCase().split(/\s+/).filter(w => w.length > 3),
      );

      // Term overlap score
      let overlap = 0;
      for (const term of atomTerms) {
        if (spanTerms.has(term)) overlap++;
      }
      const score = atomTerms.size > 0 ? overlap / atomTerms.size : 0;

      return { span, score };
    });

    // Return spans with meaningful overlap, sorted by score
    return scored
      .filter(s => s.score >= 0.2)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.span);
  }

  /**
   * Determine support kind from atom + quote characteristics.
   */
  private determineSupportKind(atom: ClaimAtom, quote: QuoteSpan): SupportKind {
    if (atom.evidence_mode === 'DIRECT_QUOTE') return 'DIRECT_QUOTE';
    if (atom.evidence_mode === 'INFERENCE') return 'INFERENCE';
    return 'PARAPHRASE';
  }

  /**
   * Apply eligible-phase admission rules (Phase 2).
   * Enforces full verification + trust requirements before binding.
   */
  private applyEligibleAdmission(
    spans: QuoteSpan[],
    facets: Facet[],
    policy: SourceAdmissionPolicy,
  ): QuoteSpan[] {
    return spans.filter(span => {
      // Find the facet this span should be checked against
      // Use the most restrictive matching facet
      for (const facet of facets) {
        const strictness = facet.strictness_override ?? 'strict';
        const rules = policy.eligible_rules.filter(
          r => r.source_kind === span.source_kind && r.strictness === strictness,
        );

        if (rules.length === 0) {
          // No matching rule — default: verified status check
          return VERIFIED_STATUSES.has(span.verification_status);
        }

        // Check if span meets eligible rules
        const passes = rules.some(rule => {
          // Must have required verification status
          if (!rule.required_verification.includes(span.verification_status)) {
            return false;
          }
          // Check authority tier if required
          if (rule.min_authority_tier !== undefined) {
            if (span.provenance_scorecard.doc_authority_tier > rule.min_authority_tier) {
              return false;
            }
          }
          return true;
        });

        if (!passes) return false;
      }

      return true;
    });
  }
}
