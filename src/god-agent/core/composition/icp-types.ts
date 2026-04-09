/**
 * Interactive Composition Pipeline (ICP) — Core Type Definitions
 *
 * Evidence-first academic writing pipeline. Evidence is corrected, claims are
 * earned, and prose becomes the final — not the first — act.
 *
 * @module icp-types
 */

import type { ToulminClaim, CitationAnchor, ClaimMap } from '../../cli/composition/sir/claim-map.js';

// =============================================================================
// ENUMS AND LITERAL TYPES
// =============================================================================

/** Verification status for quote spans (7 states) */
export type VerificationStatus =
  | 'auto_verified'
  | 'human_verified'
  | 'human_corrected'
  | 'stale_verified'
  | 'flagged'
  | 'auto_rejected'
  | 'rejected';

/** Trust tier — derived on read, never stored directly */
export type TrustTier = 'gold' | 'silver' | 'bronze' | 'red';

/** Source kind for retrieval */
export type SourceKind = 'CORPUS' | 'EXTERNAL';

/** Evidence strictness levels */
export type EvidenceStrictness = 'strict' | 'moderate' | 'permissive';

/** Atom modality — how the claim is asserted (epistemic character) */
export type AtomModality =
  | 'asserted'
  | 'hedged'
  | 'definitional'
  | 'interpretive'
  | 'historical'
  | 'inferential';

/** Atom kind — what category of thing it is (evidence policy) */
export type AtomKind =
  | 'corpus_claim'
  | 'interpretive_move'
  | 'authorial_stipulation'
  | 'method'
  | 'organization'
  | 'stub';

/** Evidence mode for atoms */
export type EvidenceMode =
  | 'DIRECT_QUOTE'
  | 'PARAPHRASE_SUPPORTED'
  | 'INFERENCE'
  | 'NO_EVIDENCE_REQUIRED';

/** Evidence requirement (can be more nuanced than EvidenceMode) */
export type EvidenceRequirement =
  | 'required'
  | 'required_in_strict'
  | 'not_required';

/** Atoms mode — graduated strictness for atom tracking */
export type AtomsMode = 'off' | 'analytics' | 'strict';

/** Reverse check mode — severity for reverse proposition checks */
export type ReverseCheckMode = 'off' | 'warn' | 'block';

/** Reverse check verdict */
export type ReverseCheckVerdict = 'OK' | 'WARN' | 'BLOCK';

/** Facet role in the document */
export type FacetRole = 'core' | 'supporting' | 'exploratory';

/** Support kind for claim bindings */
export type SupportKind = 'DIRECT_QUOTE' | 'PARAPHRASE' | 'INFERENCE';

/** Staleness reason */
export type StalenessReason =
  | 'range_intersection'
  | 'rebase_validation_failed'
  | 'anchor_regression';

/** Anchor status after rebase */
export type AnchorStatus = 'ok' | 'missing' | 'mismatch';

/** OCR patch reason tag */
export type PatchReasonTag =
  | 'hyphenation'
  | 'ligature'
  | 'linebreak_join'
  | 'diacritic'
  | 'whitespace'
  | 'curly_quote'
  | 'other';

/** Atom migration type */
export type AtomMigrationType = 'replace' | 'split' | 'merge' | 'edit_in_place';

/** Facet migration type */
export type FacetMigrationType = 'merge' | 'split' | 'delete';

/** WARN resolution type */
export type WarnResolutionType =
  | 'rhetorical_glue'
  | 'missing_atom'
  | 'needs_hedge'
  | 'scope_leak'
  | 'attribution_missing';

/** ICP session event action */
export type ICPEventAction =
  | 'retrieve'
  | 'verify'
  | 'patch'
  | 'bind'
  | 'prune'
  | 'stress_test'
  | 'plan_validate'
  | 'generate'
  | 'drift_flag'
  | 'review_fail'
  | 'export'
  | 'atom_migrate'
  | 'atom_auto_migrate'
  | 'polish_normalize'
  | 'justified_relaxation'
  | 'facet_migrate'
  | 'investigate'
  | 'regenerate'
  | 'validate_gate'
  | 'abort'
  | 'feedback'
  | 'budget_warning'
  | 'section_complete';

/** ICP event actor */
export type ICPEventActor = 'system' | 'user' | 'llm';

/** ICP event severity */
export type ICPEventSeverity = 'debug' | 'info' | 'warn' | 'block';

/** ICP event category */
export type ICPEventCategory =
  | 'evidence'
  | 'policy'
  | 'generation'
  | 'staleness'
  | 'verification'
  | 'export'
  | 'investigation'
  | 'feedback';

// =============================================================================
// POLICIES (versioned, content-addressed)
// =============================================================================

/** Normalization policy for text comparison */
export interface NormalizationPolicy {
  version: string;
  rules: NormalizationRule[];
}

export interface NormalizationRule {
  name: string;
  pattern: string;
  replacement: string;
  enabled: boolean;
}

/** Character substitution for SemanticDeltaPolicy */
export interface CharSubstitution {
  from: string;
  to: string;
  description: string;
}

/**
 * SemanticDeltaPolicy — classifies OCR patches as cosmetic vs semantic.
 * A patch is cosmetic iff ALL of:
 *   1. Only allowlisted transformations
 *   2. Token multiset similarity >= threshold
 *   3. No character substitutions outside allowlist
 */
export interface SemanticDeltaPolicy {
  version: string;
  allowlist: CharSubstitution[];
  token_similarity_threshold: number;
}

/**
 * TrustTierPolicy — computes trust tier from verification status + scorecard.
 * Versioned; RunManifest stores the version used per session.
 */
export interface TrustTierPolicy {
  version: string;
  weights: {
    status: number;
    authority: number;
    length: number;
    ocr_risk: number;
    anchor: number;
  };
  thresholds: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

/**
 * DocAuthorityPolicy — maps source types to authority tiers.
 * Lower number = higher authority.
 */
export interface DocAuthorityPolicy {
  version: string;
  tiers: Record<string, number>;
}

/**
 * SourceAdmissionPolicy — two-phase admission gating.
 * Phase 1 (candidate): minimal bar to reach verification UI.
 * Phase 2 (eligible): full bar before binding/generation.
 */
export interface SourceAdmissionPolicy {
  version: string;
  candidate_rules: SourceAdmissionRule[];
  eligible_rules: SourceAdmissionRule[];
}

export interface SourceAdmissionRule {
  source_kind: SourceKind;
  strictness: EvidenceStrictness;
  required_verification: VerificationStatus[];
  min_trust_tier?: TrustTier;
  min_authority_tier?: number;
}

/**
 * DomainLexicon — per-project domain-specific claim-bearing patterns.
 * Stored at `.god-agent/domain-lexicon.json`.
 */
export interface DomainLexicon {
  version: string;
  definition_markers: string[];
  causal_markers: string[];
  attribution_verbs: string[];
  quantifiers: string[];
  rhetorical_glue_additions: string[];
}

/** Policy reference (lightweight, stored in RunManifest) */
export interface PolicyRef {
  name: string;
  version_label: string;
  sha256: string;
}

/** Policy archive (collection of refs in RunManifest) */
export interface PolicyArchive {
  policy_refs: PolicyRef[];
}

/** Policy blob (stored at .god-agent/policies/{sha256}.json) */
export interface PolicyBlob {
  policy_name: string;
  version_label: string;
  created_at: string;
  migration_note?: string;
  compatibility?: string;
  content: unknown;
}

// =============================================================================
// QUOTE SPAN AND PROVENANCE
// =============================================================================

/**
 * ProvenanceScorecard — quality signals for a quote span.
 * All signals that reference global state MUST be computed from
 * CanonicalRegistrySnapshot, never the live store.
 */
export interface ProvenanceScorecard {
  /** Fidelity score — how closely quote matches clean_text (0-1) */
  fidelity_score: number;
  /** OCR risk score — likelihood of OCR errors (0-1, higher = riskier) */
  ocr_risk_score: number;
  /** Cluster size — number of aliases in canonical cluster */
  cluster_size: number;
  /** Prior usage count — from CanonicalRegistrySnapshot, NOT live store */
  prior_usage_count: number;
  /** Document authority tier — from DocAuthorityPolicy */
  doc_authority_tier: number;
}

/**
 * QuoteSpan — a quotation extracted from a corpus document.
 *
 * Three-tier identity:
 * - quote_id (UUID): session-local handle, may differ across re-extractions
 * - span_fingerprint: pre-canonical, sha256(doc_id + text_fingerprint + left_ctx_hash + right_ctx_hash)
 * - canonical_fingerprint: post-canonical, sha256(doc_id + canonical_span_id + text_fingerprint)
 *
 * INVARIANT: offsets are NEVER part of identity.
 */
export interface QuoteSpan {
  /** Session-local handle (UUID) — may differ across re-extractions */
  quote_id: string;

  /** sha256(normalize(text) + normalization_policy_sha) */
  text_fingerprint: string;

  /** Pre-canonical identity: sha256(doc_id + text_fingerprint + left_ctx_hash + right_ctx_hash) */
  span_fingerprint: string;

  /** Post-canonical identity (only after canonicalization) */
  canonical_fingerprint?: string;

  /** Document ID */
  doc_id: string;

  /** Page number(s) */
  page: number | [number, number];

  /** Source kind */
  source_kind: SourceKind;

  /** Range in clean_text [start, end] */
  clean_text_range: [number, number];

  /** Hash of clean_text at this range (for staleness detection) */
  clean_range_hash: string;

  /** Patch epoch at creation time */
  patch_epoch: number;

  /** NormalizationPolicy version captured at creation */
  normalization_policy_version: string;

  /** The quoted text */
  text: string;

  /** Hash of normalized 30-60 chars left of span */
  left_ctx_hash: string;

  /** Hash of normalized 30-60 chars right of span */
  right_ctx_hash: string;

  /** Verification status (7 states) */
  verification_status: VerificationStatus;

  /** Auto-verification confidence score (0-1), present when auto-verified or flagged */
  auto_confidence?: number;

  /** User role in verification workflow */
  user_role?: string;

  /** Source anchor (page ref, Bekker number, section ref) */
  source_anchor?: string;

  /** Canonical span ID (after canonicalization) */
  canonical_span_id?: string;

  /** Alias span IDs within canonical cluster */
  alias_span_ids?: string[];

  /** Provenance scorecard (all session-snapshot-scoped) */
  provenance_scorecard: ProvenanceScorecard;

  /** Stale reason (when verification_status is stale_verified) */
  stale_reason?: StalenessReason;

  /** OCR-repaired text (original `text` preserved for audit trail) */
  repaired_text?: string;

  /** Whether OCR repair was applied to this span */
  repair_applied?: boolean;

  /** Per-chunk OCR quality score (0-1, populated when ingestion provides it) (H-14) */
  ocr_quality?: number;
}

/**
 * Compute trust tier from status + scorecard + policy.
 * Trust tier is DERIVED, never stored.
 */
export function computeTrustTier(
  span: QuoteSpan,
  policy: TrustTierPolicy,
): TrustTier {
  // Stale/flagged/rejected → red
  if (
    span.verification_status === 'stale_verified' ||
    span.verification_status === 'flagged' ||
    span.verification_status === 'auto_rejected' ||
    span.verification_status === 'rejected'
  ) {
    return 'red';
  }

  const sc = span.provenance_scorecard;
  const w = policy.weights;

  // Status contribution: verified statuses get full marks
  const statusScore = (
    span.verification_status === 'human_verified' ||
    span.verification_status === 'human_corrected'
  ) ? 1.0 : 0.7; // auto_verified

  // Authority: normalize to 0-1 (tier 1 = best = 1.0, tier 5 = worst = 0.0)
  const authorityScore = Math.max(0, 1 - (sc.doc_authority_tier - 1) / 4);

  // Length factor: derived from text length, never stored
  const quoteLengthFactor = Math.min(1.0, span.text.length / 200);

  // OCR risk: invert (lower risk = higher score)
  const ocrScore = 1 - sc.ocr_risk_score;

  // Anchor confidence: 0 if no anchor, 0.5 neutral, 1.0 strong match
  const anchorScore = span.source_anchor ? 0.8 : 0.5;

  const composite =
    statusScore * w.status +
    authorityScore * w.authority +
    quoteLengthFactor * w.length +
    ocrScore * w.ocr_risk +
    anchorScore * w.anchor;

  if (composite >= policy.thresholds.gold) return 'gold';
  if (composite >= policy.thresholds.silver) return 'silver';
  if (composite >= policy.thresholds.bronze) return 'bronze';
  return 'red';
}

// =============================================================================
// OCR PATCHES
// =============================================================================

/**
 * OCRPatch — a correction applied to a document's text.
 * Patches are document-first and range-first, not quote-first.
 */
export interface OCRPatch {
  /** Unique patch ID */
  patch_id: string;
  /** Document ID */
  doc_id: string;
  /** Page number */
  page: number;
  /** Range in clean_text before patch [start, end] */
  before_range: [number, number];
  /** Range in clean_text after patch [start, end] */
  after_range: [number, number];
  /** Hash of text before patch */
  before_hash: string;
  /** Hash of text after patch */
  after_hash: string;
  /** Text before patch */
  before_text: string;
  /** Text after patch */
  after_text: string;
  /** Categorization of the patch */
  reason_tag: PatchReasonTag;
  /** When the patch was created */
  timestamp: string;
  /** Who created the patch */
  author: string;
  /** Derived: span fingerprints impacted by this patch (computed at commit time) */
  impacted_span_fingerprints?: string[];
}

// =============================================================================
// SOURCE SCOPE AND FACETS
// =============================================================================

/**
 * SourceScopeSpec — controls where evidence comes from.
 */
export interface SourceScopeSpec {
  mode: 'corpus' | 'hybrid' | 'external';
  corpus_config?: {
    collections: string[];
    min_relevance: number;
    max_chunks: number;
  };
  hybrid_config?: {
    corpus_priority: number;
    external_fallback_threshold: number;
  };
  external_config?: {
    allowed_sources: string[];
    max_results: number;
  };
  doc_authority_policy: DocAuthorityPolicy;
}

/**
 * FacetStrictnessConfig — global default + per-facet overrides.
 */
export interface FacetStrictnessConfig {
  global_default: EvidenceStrictness;
  per_facet_overrides: Map<string, EvidenceStrictness>;
}

/**
 * Facet — a thematic dimension of the research question.
 * facet_id is immutable once created; merges/splits create new IDs.
 */
export interface Facet {
  /** Immutable UUID */
  facet_id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Role in document */
  facet_role: FacetRole;
  /** Strictness override (inherits global if undefined) */
  strictness_override?: EvidenceStrictness;
  /** Whether SentenceScope.adds_atoms is permitted */
  allow_adds_atoms?: boolean;
  /** Evidence policy per atom kind (facet-level override) */
  evidence_policy_for_kind: Map<AtomKind, EvidenceRequirement>;
  /** Whether this facet has been archived (for merge/split migrations) */
  archived: boolean;
  /** Atoms mode for this facet */
  atoms_mode?: AtomsMode;
  /** Reverse check mode for this facet */
  reverse_check_mode?: ReverseCheckMode;
}

/**
 * FacetMigration — records merge/split/delete operations on facets.
 */
export interface FacetMigration {
  migration_id: string;
  type: FacetMigrationType;
  source_facet_ids: string[];
  target_facet_ids: string[];
  atom_reassignment_rules: Record<string, string>;
  timestamp: string;
}

// =============================================================================
// PROMPT AND WRITING CONTRACT
// =============================================================================

/**
 * PromptSpec — decomposed research question.
 */
export interface PromptSpec {
  /** Original user prompt */
  original_prompt: string;
  /** Research question lattice */
  research_questions: string[];
  /** Facets that passed validation (have corpus evidence) */
  required_facets: Facet[];
  /** Facets that failed validation (low/no evidence) */
  optional_facets: Facet[];
  /** Retrieval lexicon — terms for per-facet retrieval */
  retrieval_lexicon: Map<string, string[]>;
  /** Success criteria per facet */
  success_criteria: Map<string, string>;
  /** Suggested primary sources from decomposition (auto-derived from prompt concepts) */
  suggestedPrimarySources?: Array<{ author: string; title: string; reason: string }>;
  /** Suggested secondary scholarship for interpretive context */
  suggestedSecondarySources?: Array<{ author: string; title: string; reason: string }>;
}

/**
 * WritingContract — the agreement between evidence and generation.
 */
export interface WritingContract {
  /** Thesis statement */
  thesis: string;
  /** Scope boundaries */
  scope: string;
  /** Required quotations (must appear in final text) */
  required_quotations: QuoteSpan[];
  /** Target audience */
  audience: string;
  /** Section outline */
  section_outline: SectionOutlineEntry[];
  /** Facet coverage requirements */
  facet_requirements: Map<string, FacetCoverageRequirement>;
}

export interface SectionOutlineEntry {
  section_id: string;
  title: string;
  facet_ids: string[];
  paragraph_count_estimate: number;
}

export interface FacetCoverageRequirement {
  facet_id: string;
  min_verified_spans: number;
  min_definitional_spans: number;
  min_distinct_documents: number;
  strictness: EvidenceStrictness;
}

// =============================================================================
// CLAIM ATOMS
// =============================================================================

/**
 * ClaimAtom — atomic proposition decomposed from a ToulminClaim.
 *
 * atom_id is a stable UUID. All references point to atom_id.
 * display_text edits don't change identity or trigger migrations.
 * semantic_text edits increment atom_version_id.
 */
export interface ClaimAtom {
  /** Stable UUID identity */
  atom_id: string;
  /** Increments on semantic_text edits */
  atom_version_id: number;
  /** Editable presentation text (doesn't change identity) */
  display_text: string;
  /** Normalized proposition for entailment/fingerprint */
  semantic_text: string;
  /** How the claim is asserted */
  modality: AtomModality;
  /** What category of thing it is */
  kind: AtomKind;
  /** Parent ToulminClaim ID */
  parent_claim_id: string;
  /** Evidence mode (defaulted by kind, overrideable) */
  evidence_mode: EvidenceMode;
  /** Bound quote span IDs */
  bound_quote_ids: string[];
  /** Facet this atom belongs to */
  facet_id: string;
}

/**
 * AtomMigration — tracks atom ID changes for reproducibility.
 */
export interface AtomMigration {
  migration_id: string;
  old_atom_id: string;
  new_atom_id: string;
  type: AtomMigrationType;
  timestamp: string;
  /** For merge: which old atoms were merged */
  merged_from?: string[];
  /** For split: which new atoms resulted */
  split_into?: string[];
}

/**
 * NewAtomDeclaration — declared when SentenceScope adds a new atom
 * (only permitted in permissive/exploratory mode).
 */
export interface NewAtomDeclaration {
  display_text: string;
  semantic_text: string;
  modality: AtomModality;
  kind: AtomKind;
  suggested_evidence_mode: EvidenceMode;
}

// =============================================================================
// SENTENCE SCOPE AND PARAGRAPH PLAN
// =============================================================================

/**
 * SentenceScope — maps a sentence to the atoms it entails.
 */
export interface SentenceScope {
  /** Stable UUID identity */
  sentence_id: string;
  /** Parent paragraph */
  paragraph_id: string;
  /** Order within paragraph (mutable for reordering) */
  sentence_order: number;
  /** Atom IDs this sentence entails */
  supports_atoms: string[];
  /** New atoms declared (DISALLOWED in strict/claim_locked mode) */
  adds_atoms?: NewAtomDeclaration[];
  /** Sentence text */
  text: string;
}

/**
 * ParagraphPlanEntry — a single paragraph in the generation plan.
 */
export interface ParagraphPlanEntry {
  /** Stable UUID */
  paragraph_id: string;
  /** Display order (mutable) */
  paragraph_order: number;
  /** Atom IDs to cover in this paragraph */
  atom_ids: string[];
  /** Required quotes for this paragraph */
  required_quotes: string[];
  /** Section this paragraph belongs to */
  section_id?: string;
}

/**
 * DiscourseState — passed into each GenerationUnit for coherence.
 */
export interface DiscourseState {
  /** Last 3 sentences of previous paragraph */
  last_paragraph_tail: string[];
  /** Transitions used so far (to avoid repetition) */
  transitions_used_so_far: string[];
  /** Rhetorical goal of current section */
  rhetorical_goal: string;
  /** Section-level argument trajectory */
  section_argument_trajectory: string;
}

// =============================================================================
// CLAIM BINDING
// =============================================================================

/**
 * ClaimBinding — links claims/atoms to quote evidence.
 */
export interface ClaimBinding {
  /** Stable UUID */
  binding_id: string;
  /** ToulminClaim ID */
  claim_id: string;
  /** Atom IDs within the claim that this binding supports */
  atom_ids: string[];
  /** Quote span IDs providing evidence */
  quote_ids: string[];
  /** How the evidence supports the claim */
  support_kind: SupportKind;
  /** Optional reasoning note */
  warrant_note?: string;
  /** Whether this binding is stale (corpus change) */
  staleness_status: 'current' | 'stale';
}

/**
 * HypothesisClaim — demoted claim that persists for future expansion.
 */
export interface HypothesisClaim {
  claim_id: string;
  original_claim: ToulminClaim;
  atoms: ClaimAtom[];
  demotion_reason: string;
  demotion_timestamp: string;
  source_bindings: ClaimBinding[];
}

// =============================================================================
// QUOTE BUDGET AND RANKING
// =============================================================================

/**
 * QuoteRankSpec — scoring weights for quote ranking.
 */
export interface QuoteRankSpec {
  facet_alignment: number;
  role_weight: number;
  binding_potential: number;
  authority: number;
  redundancy_penalty: number;
  length_penalty: number;
}

/**
 * QuoteBudgetPlan — result of budget enforcement post-binding.
 */
export interface QuoteBudgetPlan {
  /** Quotes included in the active set */
  included_quote_ids: string[];
  /** Quotes pruned by budget */
  pruned_quote_ids: string[];
  /** Reason for each pruning */
  prune_reasons: Map<string, string>;
  /** Total budget */
  budget: number;
}

/**
 * ActiveQuoteSet — the approved set of quotes for generation.
 */
export interface ActiveQuoteSet {
  /** Quotes in the active set */
  quotes: QuoteSpan[];
  /** Pinned quotes (must appear) */
  pinned: Set<string>;
  /** Boosted quotes (preferred) */
  boosted: Set<string>;
  /** Demoted quotes (lower priority) */
  demoted: Set<string>;
  /** Excluded quotes (will not appear) */
  excluded: Set<string>;
}

// =============================================================================
// STRESS TEST
// =============================================================================

/**
 * StressTestReport — results of claim stress testing.
 */
export interface StressTestReport {
  /** Tested atoms */
  atom_results: AtomStressResult[];
  /** Overall summary */
  summary: {
    total_tested: number;
    passed: number;
    warned: number;
    failed: number;
    demoted: number;
  };
}

export interface AtomStressResult {
  atom_id: string;
  /** Warrant adequacy verdict */
  warrant_verdict: 'adequate' | 'weak' | 'missing';
  /** Contested scholarship alert */
  contested: boolean;
  /** Fragility warning from contradiction retrieval */
  fragility_warning?: string;
  /** Recommended remediation actions */
  remediations: StressRemediation[];
}

export type StressRemediation =
  | { type: 'split'; suggested_atoms: string[] }
  | { type: 'qualify'; suggested_modality: AtomModality }
  | { type: 'demote' }
  | { type: 'add_rebuttal'; contra_evidence: string }
  | { type: 'request_more_evidence'; facet_id: string }
  | { type: 'acknowledge_contradiction'; contra_quote_id: string };

// =============================================================================
// EVIDENCE SCARCITY
// =============================================================================

/**
 * EvidenceScarcityWarning — emitted when a facet has fragile evidence.
 */
export interface EvidenceScarcityWarning {
  facet_id: string;
  warning_type: 'low_span_count' | 'no_definitional_spans' | 'paraphrase_only' | 'single_document';
  details: string;
}

// =============================================================================
// BLOCK REASON AND REMEDIATION
// =============================================================================

/**
 * BlockReason — returned for every blocked action.
 */
export interface BlockReason {
  action: string;
  facet_id?: string;
  rule_id: string;
  required_state: string;
  observed_state: string;
  minimal_remediations: string[];
}

/**
 * JustifiedRelaxation — user-provided rationale for relaxing strictness.
 */
export interface JustifiedRelaxation {
  facet_id: string;
  previous_strictness: EvidenceStrictness;
  new_strictness: EvidenceStrictness;
  rationale: string;
  timestamp: string;
}

/**
 * TrustedAnalogueEntry — external document promoted to corpus-equivalent.
 */
export interface TrustedAnalogueEntry {
  doc_id: string;
  title: string;
  authority_rationale: string;
  verified_by: string;
  verified_at: string;
  policy_version: string;
}

// =============================================================================
// WARN RESOLUTION
// =============================================================================

/**
 * WarnResolution — structured resolution of a reverse-check WARN.
 */
export interface WarnResolution {
  warn_id: string;
  resolution_type: WarnResolutionType;
  resolved_by: string;
  timestamp: string;
  payload: WarnResolutionPayload;
}

export type WarnResolutionPayload =
  | { type: 'rhetorical_glue'; dismissed: true }
  | { type: 'missing_atom'; new_atom_id: string; binding_id?: string }
  | { type: 'needs_hedge'; atom_id: string; old_modality: AtomModality; new_modality: AtomModality }
  | { type: 'scope_leak'; moved_sentence_id: string; from_facet_id: string; to_facet_id?: string; mode_change?: AtomsMode }
  | { type: 'attribution_missing'; created_atom_id: string; attributed_source: string };

// =============================================================================
// PARAGRAPH LEDGER
// =============================================================================

/**
 * ParagraphLedger — deterministically recomputed, not mutable state.
 * Derived from paragraph plan + SentenceScope + bindings + strictness + drift + resolutions.
 */
export interface ParagraphLedger {
  items: ParagraphLedgerItem[];
  ledger_hash: string;
}

export interface ParagraphLedgerItem {
  paragraph_id: string;
  paragraph_order: number;
  atom_ids: string[];
  quote_ids: string[];
  strictness: EvidenceStrictness;
  coverage_stats: {
    atoms_covered: number;
    atoms_total: number;
    quotes_used: number;
  };
  drift_flags: DriftFlag[];
  warn_resolutions: WarnResolution[];
}

export interface DriftFlag {
  sentence_id: string;
  verdict: ReverseCheckVerdict;
  proposition: string;
  unmapped_atoms?: string[];
}

// =============================================================================
// CANONICAL REGISTRY SNAPSHOT
// =============================================================================

/**
 * CanonicalRegistrySnapshot — frozen at session start for deterministic scoring.
 * Stage B signals ONLY consult this snapshot, never the live store.
 */
export interface CanonicalRegistrySnapshot {
  snapshot_hash: string;
  captured_at: string;
  verified_canonical_spans: Map<string, {
    verification_status: VerificationStatus;
    usage_count: number;
    authority_tier: number;
  }>;
}

// =============================================================================
// ICP SESSION AND EVENTS
// =============================================================================

/**
 * ICPSessionEvent — append-only audit trail entry.
 * State is authoritative; events are NOT full event sourcing.
 */
export interface ICPSessionEvent {
  /** Timestamp */
  ts: string;
  /** Who performed the action */
  actor: ICPEventActor;
  /** What happened */
  action: ICPEventAction;
  /** Summary of the payload */
  payload_summary: string;
  /** IDs affected by this event */
  affected_ids: string[];
  /** Session revision counter */
  session_revision: number;
  /** Event severity */
  severity: ICPEventSeverity;
  /** Whether this event should be shown in UI */
  user_visible: boolean;
  /** Event category for filtering */
  category: ICPEventCategory;
}

/**
 * ICPSession — the full pipeline state object.
 */
export interface ICPSession {
  /** Session ID */
  session_id: string;
  /** Decomposed prompt */
  prompt_spec: PromptSpec;
  /** Source scope configuration */
  source_scope: SourceScopeSpec;
  /** All facets (including archived) */
  facets: Facet[];
  /** Extracted quote spans */
  quote_spans: QuoteSpan[];
  /** Claim map (Toulmin structure) */
  claim_map?: ClaimMap;
  /** Claim-evidence bindings */
  bindings: ClaimBinding[];
  /** Demoted claims */
  hypothesis_claims: HypothesisClaim[];
  /** Generation paragraph plan */
  paragraph_plan: ParagraphPlanEntry[];
  /** Paragraph ledger (deterministically recomputed) */
  paragraph_ledger?: ParagraphLedger;
  /** Generated text sections */
  generated_text: Map<string, string>;
  /** Review results */
  review_results?: ReviewResults;
  /** Run manifest snapshot */
  run_manifest?: RunManifest;
  /** Append-only event log */
  event_log: ICPSessionEvent[];
  /** Atom migrations */
  atom_migrations: AtomMigration[];
  /** Facet migrations */
  facet_migrations: FacetMigration[];
  /** Canonical registry snapshot (captured at session start) */
  canonical_registry_snapshot?: CanonicalRegistrySnapshot;
  /** Active quote set */
  active_quote_set?: ActiveQuoteSet;
  /** Writing contract */
  writing_contract?: WritingContract;
  /** Stress test report */
  stress_test_report?: StressTestReport;
  /** All claim atoms */
  atoms: ClaimAtom[];
  /** Sentence scopes for generated text */
  sentence_scopes: SentenceScope[];
  /** Current session revision */
  revision: number;
  /** Session creation time */
  created_at: string;
  /** Session last modified time */
  updated_at: string;
  /** Style profile ID used for generation */
  style_profile_id?: string;
  /** Cached style prompt (generated from profile) */
  style_prompt?: string;
  /** Desired word count range for generation */
  desired_word_count?: string;
  /** Draft category (section, chapter, paper, etc.) */
  draft_category?: string;
  /** Corpus folder restriction (e.g., 'rhetorical_ontology') */
  corpus_folder?: string;
  /** Quality gate results from post-generation pipeline */
  quality_gates?: QualityGateResults;
  /** Pipeline phase state machine */
  pipeline_phase?: 'CREATED' | 'DECOMPOSED' | 'RETRIEVED' | 'VERIFIED' | 'BOUND' | 'GENERATED' | 'PARTIALLY_GENERATED' | 'INVESTIGATED' | 'REGENERATED' | 'VALIDATED' | 'EXPORTED';
  /** Investigation results from v1 analysis */
  investigation_results?: {
    issues: Array<{ type: string; severity: 'critical' | 'major' | 'minor'; detail: string }>;
    preventionPlan: {
      blacklistedAuthors: string[];
      strengthenedConstraints: string[];
      underCitedSources: string[];
      overCitedSources: string[];
    };
    stats: {
      wordCount: number;
      sectionCount: number;
      citationCount: number;
      quotationCount: number;
      claimsWithoutCitation: number;
      factualClaimsWithoutCitation: number;
      interpretiveClaimsWithoutCitation: number;
      uniqueAuthors: string[];
      sectionWordCounts: Array<{ heading: string; words: number }>;
    };
  };
  /** Haiku summaries of completed sections (for tiered compression) */
  section_summaries?: string[];
  /** SoNA trajectory ID for learning feedback */
  trajectory_id?: string;
  /** Adapter configuration used for this session */
  adapter_config?: Record<string, unknown>;
  /** User-corrected text (for SoNA feedback delta) */
  corrected_text?: Map<string, string>;
}

/**
 * QualityGateResults — aggregated results from all post-generation quality gates.
 */
export interface QualityGateResults {
  /** Citation enforcement (WS4) */
  citation_enforcement?: {
    passed: boolean;
    action: string;
    corrections: number;
    hallucinations_caught: number;
    total_citations: number;
  };
  /** Quality gauntlet (WS6) */
  gauntlet?: {
    passed: boolean;
    overall_score: number;
    stages_passed: number;
    total_stages: number;
    critical_issues: number;
    revision_required: boolean;
    stage_results?: Array<{ name: string; score: number; passed: boolean }>;
  };
  /** Endnote generation (WS7) */
  endnotes?: {
    total: number;
    supporting_quotations: number;
    sources_used: string[];
  };
  /** Bibliography (WS7) */
  bibliography?: {
    sources_count: number;
  };
  /** Prose sanitization (WS2 + WS5) */
  sanitization?: {
    artifacts_removed: number;
    passes: number;
  };
  /** Style profile (WS1) */
  style_profile?: {
    id: string;
    applied: boolean;
  };
  /** Checkpoints created (WS10) */
  checkpoints?: string[];
  /** Author scrubbing results */
  author_scrubbing?: {
    removedCount: number;
    removedAuthors: string[];
    contexts: Record<string, string[]>;
  };
  /** APA citation stripping results */
  apa_stripping?: {
    strippedCount: number;
    stripped: string[];
  };
  /** Endnote leak detection results */
  endnote_leaks?: {
    leaksRemoved: number;
  };
  /** Edge coherence validation results */
  edge_coherence?: {
    score: number;
    contradictions: Array<{ assertion: string; conflictsWith: string }>;
  };
  /** Investigation results (from multi-step drafting) */
  investigation?: {
    hallucinatedAuthors: string[];
    phantomQuotations: number;
    shortSections: number;
    overCitedSources: string[];
    underCitedSources: string[];
  };
  /** Tension awareness validation results (cross-author integration) */
  tension_awareness?: {
    passed: boolean;
    tensionsChecked: number;
    tensionsAcknowledged: number;
    unacknowledgedTensions: Array<{
      tensionId: string;
      nodeA: string;
      nodeB: string;
      description: string;
    }>;
  };
  /** Unanchored reasoning edges — edges injected into generation but not grounded in QuoteSpans */
  unanchored_edges?: Array<{
    edgeId: string;
    relation: string;
    source: string;
    target: string;
    missingConcepts: string[];
  }>;
  /** Cross-author conflict events — derived from tension awareness gate (H-12) */
  author_conflict_events?: AuthorConflictEvent[];
  /** OCR quality summary across bound QuoteSpans (H-14) */
  ocr_quality?: OcrQualitySummary;
}

/** Cross-author conflict event — emitted for every detected tension (H-12) */
export interface AuthorConflictEvent {
  facetId: string;
  authors: string[];
  relation: string;
  source: string;
  target: string;
  description: string;
  unacknowledged: boolean;
  timestamp: string;
}

/** OCR quality summary across QuoteSpans (H-14) */
export interface OcrQualitySummary {
  average: number;
  min: number;
  max: number;
  low_quality_count: number;
}

/**
 * ReviewResults — output of deterministic review.
 */
export interface ReviewResults {
  /** Quote fidelity checks */
  quote_fidelity: QuoteFidelityResult[];
  /** Claim coverage (no orphan sentences) */
  claim_coverage: ClaimCoverageResult;
  /** Facet coverage validation */
  facet_coverage: FacetCoverageResult[];
  /** Multi-claim sentence detections */
  multi_claim_sentences: MultiClaimSentence[];
  /** Overall pass/fail */
  passed: boolean;
  /** Failure classifications */
  failures: ReviewFailure[];
}

export interface QuoteFidelityResult {
  quote_id: string;
  rendered_text: string;
  original_text: string;
  normalized_match: boolean;
  exact_match: boolean;
}

export interface ClaimCoverageResult {
  total_sentences: number;
  mapped_sentences: number;
  orphan_sentences: string[];
}

export interface FacetCoverageResult {
  facet_id: string;
  required_atoms: number;
  covered_atoms: number;
  missing_atom_ids: string[];
  meets_threshold: boolean;
}

export interface MultiClaimSentence {
  sentence_id: string;
  atom_count: number;
  atom_ids: string[];
}

export interface ReviewFailure {
  type: 'generation_error' | 'binding_error' | 'corpus_change';
  description: string;
  affected_ids: string[];
}

// =============================================================================
// RUN MANIFEST
// =============================================================================

/**
 * RunManifest — immutable snapshot of a completed pipeline run.
 * Enables regression testing and reproducibility.
 */
export interface RunManifest {
  /** Run ID */
  run_id: string;
  /** When this run was created */
  created_at: string;
  /** PromptSpec used */
  prompt_spec: PromptSpec;
  /** Source scope */
  source_scope: SourceScopeSpec;
  /** Hash of corpus at time of run */
  corpus_hash: string;
  /** Patch epoch at time of run */
  patch_epoch: number;
  /** Claim map snapshot */
  claim_map?: ClaimMap;
  /** Bindings snapshot */
  bindings: ClaimBinding[];
  /** Hypothesis claims snapshot */
  hypothesis_claims: HypothesisClaim[];
  /** Pre-polish draft text */
  pre_polish_draft?: string;
  /** Corpus version diff (when corpus changed between runs) */
  corpus_version_diff?: CorpusVersionDiff;
  /** Event log snapshot */
  event_log_snapshot: ICPSessionEvent[];
  /** Canonical registry snapshot hash */
  canonical_registry_hash?: string;
  /** Paragraph ledger snapshot */
  paragraph_ledger_snapshot?: ParagraphLedger;
  /** Ledger hash */
  ledger_hash?: string;
  /** Atom migrations snapshot */
  atom_migrations_snapshot: AtomMigration[];
  /** Facet migrations snapshot */
  facet_migrations_snapshot: FacetMigration[];
  /** Policy archive (lightweight refs) */
  policy_archive: PolicyArchive;
}

/**
 * CorpusVersionDiff — changes between two corpus versions.
 */
export interface CorpusVersionDiff {
  /** Patches applied between versions */
  patches_applied: OCRPatch[];
  /** Quote spans with changed text */
  affected_quote_spans: string[];
  /** Bindings that became stale */
  stale_bindings: string[];
  /** Claims affected */
  affected_claims: string[];
}

// =============================================================================
// EXPORT PACKAGE
// =============================================================================

/**
 * ExportPackage — final deliverable from the ICP pipeline.
 */
export interface ExportPackage {
  /** Final polished prose (Markdown) */
  final_prose: string;
  /** Endnotes */
  endnotes: string;
  /** Bibliography */
  bibliography: string;
  /** Claim map appendix (Mermaid diagram) */
  claim_map_appendix: string;
  /** Evidence ledger */
  evidence_ledger: string;
  /** Paragraph ledger */
  paragraph_ledger: ParagraphLedger;
  /** Run manifest (full provenance) */
  run_manifest: RunManifest;
  /** Methodology trace (from event log — advisor-facing) */
  methodology_trace: string;
}

// =============================================================================
// AUTO-VERIFICATION (Stage A + Stage B)
// =============================================================================

/**
 * StageAResult — deterministic structural checks (text-primary).
 */
export interface StageAResult {
  passed: boolean;
  match_type: 'exact' | 'normalized' | 'approximate' | 'none';
  /** Text-primary: anchors do NOT cause Stage A failure */
  text_found_in_clean: boolean;
}

/**
 * StageBSignals — multi-signal confidence score components.
 */
export interface StageBSignals {
  /** Exact/normalized/approximate match quality */
  exactness: number;
  /** OCR risk from ProvenanceScorecard */
  ocr_risk_score: number;
  /** Derived from QuoteSpan.text.length — never stored separately */
  quote_length_factor: number;
  /** From DocAuthorityPolicy */
  doc_authority_tier: number;
  /** Whether quote overlaps a previously human-verified canonical span (from snapshot) */
  canonical_overlap: number;
  /** Anchor match quality */
  anchor_confidence: number;
}

export interface StageBWeights {
  exactness: number;
  ocr_risk_score: number;
  quote_length_factor: number;
  doc_authority_tier: number;
  canonical_overlap: number;
  anchor_confidence: number;
}

/** Default Stage B weights */
export const DEFAULT_STAGE_B_WEIGHTS: StageBWeights = {
  exactness: 0.25,
  ocr_risk_score: 0.20,
  quote_length_factor: 0.15,
  doc_authority_tier: 0.10,
  canonical_overlap: 0.20,
  anchor_confidence: 0.10,
};

/**
 * AutoVerificationResult — combined Stage A + Stage B.
 */
export interface AutoVerificationResult {
  stage_a: StageAResult;
  stage_b_signals: StageBSignals;
  auto_confidence: number;
  recommended_status: VerificationStatus;
  reasoning: string;
}

// =============================================================================
// STALENESS TYPES (consumed by quote-span-staleness.ts)
// =============================================================================

/**
 * StalenessVerdict — result of computeStaleness().
 */
export interface StalenessVerdict {
  is_stale: boolean;
  reason?: StalenessReason;
  patch_ids?: string[];
  details: string;
}

/**
 * StalenessCandidateDelta — returned by markCandidatesOnPatchCommit().
 */
export interface StalenessCandidateDelta {
  doc_id: string;
  new_candidates: Set<string>;
  candidate_reasons: Map<string, { reason: StalenessReason; patch_ids: string[] }>;
}

/**
 * LocateResult — result of locateSpan() after rebase.
 */
export interface LocateResult {
  found: boolean;
  new_range?: [number, number];
  method: 'exact_rebase' | 'snap_to_match' | 'bounded_fallback' | 'not_found';
  disambiguation?: {
    candidates_found: number;
    selected_index: number;
    selection_reason: string;
  };
}

/**
 * DocStalenessIndex — per-document index for efficient staleness checks.
 */
export interface DocStalenessIndex {
  doc_id: string;
  current_patch_epoch: number;
  candidates_by_epoch: Map<number, Set<string>>;
  candidate_reasons: Map<string, { reason: StalenessReason; patch_ids: string[] }>;
  span_locator: Map<string, {
    clean_range: [number, number];
    clean_range_hash: string;
    patch_epoch_at_last_locate: number;
  }>;
}

// =============================================================================
// OCR PATCH STORE TYPES
// =============================================================================

/**
 * PatchCheckpoint — snapshot for performance guard on long-lived documents.
 */
export interface PatchCheckpoint {
  epoch: number;
  clean_text_snapshot: string;
  interval_map_state: IntervalEdit[];
  created_at: string;
}

/**
 * IntervalEdit — a single edit in the interval map (rope-edit log).
 */
export interface IntervalEdit {
  /** Epoch when this edit was committed */
  epoch: number;
  /** Range in clean_text before edit */
  original_range: [number, number];
  /** Length of replacement text */
  replacement_length: number;
}

// =============================================================================
// PROPOSITION EXTRACTION (for reverse checks)
// =============================================================================

/**
 * ExtractedProposition — a proposition found by the predicate filter.
 */
export interface ExtractedProposition {
  text: string;
  sentence_id: string;
  predicate_type: 'definitional' | 'causal' | 'quantified' | 'attributed';
  matched_pattern: string;
  severity: ReverseCheckVerdict;
}

// =============================================================================
// HELPERS AND DEFAULTS
// =============================================================================

/** Default evidence policy by atom kind */
export function defaultEvidenceMode(kind: AtomKind): EvidenceMode {
  switch (kind) {
    case 'corpus_claim':
      return 'DIRECT_QUOTE';
    case 'interpretive_move':
      return 'PARAPHRASE_SUPPORTED';
    case 'authorial_stipulation':
    case 'method':
    case 'organization':
      return 'NO_EVIDENCE_REQUIRED';
    case 'stub':
      return 'NO_EVIDENCE_REQUIRED';
  }
}

/** Default evidence requirement by kind and strictness */
export function defaultEvidenceRequirement(
  kind: AtomKind,
  strictness: EvidenceStrictness,
): EvidenceRequirement {
  switch (kind) {
    case 'corpus_claim':
      return 'required';
    case 'interpretive_move':
      return strictness === 'strict' ? 'required_in_strict' : 'not_required';
    case 'authorial_stipulation':
    case 'method':
    case 'organization':
    case 'stub':
      return 'not_required';
  }
}

/** Verified statuses that pass the gating check */
export const VERIFIED_STATUSES: ReadonlySet<VerificationStatus> = new Set<VerificationStatus>([
  'auto_verified',
  'human_verified',
  'human_corrected',
]);

/** Default QuoteRankSpec weights */
export const DEFAULT_QUOTE_RANK_SPEC: QuoteRankSpec = {
  facet_alignment: 0.35,
  role_weight: 0.25,
  binding_potential: 0.20,
  authority: 0.10,
  redundancy_penalty: 0.05,
  length_penalty: 0.05,
};

/** Default TrustTierPolicy */
export const DEFAULT_TRUST_TIER_POLICY: TrustTierPolicy = {
  version: '1.0.0',
  weights: {
    status: 0.25,
    authority: 0.25,
    length: 0.15,
    ocr_risk: 0.20,
    anchor: 0.15,
  },
  thresholds: {
    gold: 0.85,
    silver: 0.65,
    bronze: 0.45,
  },
};

/** Default SemanticDeltaPolicy */
export const DEFAULT_SEMANTIC_DELTA_POLICY: SemanticDeltaPolicy = {
  version: '1.0.0',
  allowlist: [
    { from: '\uFB01', to: 'fi', description: 'fi ligature' },
    { from: '\uFB02', to: 'fl', description: 'fl ligature' },
    { from: '\uFB03', to: 'ffi', description: 'ffi ligature' },
    { from: '\uFB04', to: 'ffl', description: 'ffl ligature' },
    { from: '\u02BC', to: "'", description: 'modifier letter apostrophe' },
    { from: '\u2019', to: "'", description: 'right single quotation mark' },
    { from: '\u201C', to: '"', description: 'left double quotation mark' },
    { from: '\u201D', to: '"', description: 'right double quotation mark' },
  ],
  token_similarity_threshold: 0.99,
};

/** Default NormalizationPolicy */
export const DEFAULT_NORMALIZATION_POLICY: NormalizationPolicy = {
  version: '1.0.0',
  rules: [
    { name: 'collapse_whitespace', pattern: '\\s+', replacement: ' ', enabled: true },
    { name: 'trim', pattern: '^\\s+|\\s+$', replacement: '', enabled: true },
    { name: 'normalize_quotes', pattern: '[\u2018\u2019\u02BC]', replacement: "'", enabled: true },
    { name: 'normalize_double_quotes', pattern: '[\u201C\u201D]', replacement: '"', enabled: true },
  ],
};

/** Create a new empty ICPSession */
export function createICPSession(
  sessionId: string,
  promptSpec: PromptSpec,
  sourceScope: SourceScopeSpec,
): ICPSession {
  const now = new Date().toISOString();
  return {
    session_id: sessionId,
    prompt_spec: promptSpec,
    source_scope: sourceScope,
    facets: [...promptSpec.required_facets, ...promptSpec.optional_facets],
    quote_spans: [],
    bindings: [],
    hypothesis_claims: [],
    paragraph_plan: [],
    generated_text: new Map(),
    event_log: [],
    atom_migrations: [],
    facet_migrations: [],
    atoms: [],
    sentence_scopes: [],
    revision: 0,
    created_at: now,
    updated_at: now,
    pipeline_phase: 'CREATED',
  };
}

/** Emit an ICPSessionEvent and update session revision */
export function emitSessionEvent(
  session: ICPSession,
  event: Omit<ICPSessionEvent, 'session_revision'>,
): void {
  session.revision += 1;
  session.event_log.push({
    ...event,
    session_revision: session.revision,
  });
  session.updated_at = new Date().toISOString();
}
