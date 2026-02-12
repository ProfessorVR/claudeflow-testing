/**
 * Universal Validation Types
 *
 * Core type definitions for the universal inline citation/claim validation system.
 * These types provide a unified interface for validating content against:
 * - Local corpus (ChromaDB knowledge_chunks)
 * - Web search results
 * - Mixed/hybrid sources
 *
 * @module core/validation/types
 */

// =============================================================================
// Source Types & Trust Levels
// =============================================================================

/**
 * Source type for provenance tracking
 */
export type SourceType = 'corpus' | 'web' | 'llm_knowledge' | 'user_provided';

/**
 * Trust level for different source types
 *
 * - verified: Corpus sources, trusted academic databases
 * - semi_verified: Wikipedia, semi-trusted web sources
 * - unverified: Unknown web sources, requires caution
 * - unknown: Cannot determine, treat as unverified
 */
export type TrustLevel = 'verified' | 'semi_verified' | 'unverified' | 'unknown';

/**
 * Validation strictness levels
 *
 * - strict: Every claim must have verifiable source (academic mode)
 * - moderate: Key claims need sources, minor claims OK
 * - relaxed: Flag potential issues but allow generation
 */
export type ValidationStrictness = 'strict' | 'moderate' | 'relaxed';

/**
 * Validation mode based on available sources
 *
 * - corpus_only: Traditional academic validation against local corpus
 * - web_only: Validate against fetched web content only
 * - hybrid: Validate against both corpus and web, track provenance
 * - llm_only: No verified sources available (high risk mode)
 */
export type ValidationMode = 'corpus_only' | 'web_only' | 'hybrid' | 'llm_only';

// =============================================================================
// Evidence Structures
// =============================================================================

/**
 * Provenance tracking entry
 */
export interface ProvenanceEntry {
  /** Action taken (retrieved, validated, cited, paraphrased, quoted) */
  action: 'retrieved' | 'validated' | 'cited' | 'paraphrased' | 'quoted';

  /** When this action occurred */
  timestamp: Date;

  /** Validator or system that performed the action */
  validator?: string;

  /** Confidence score for this action (0-1) */
  confidence?: number;

  /** Additional details */
  details?: Record<string, unknown>;
}

/**
 * Unified metadata structure for all source types
 */
export interface EvidenceMetadata {
  // Common fields
  /** Author name(s) */
  author?: string;

  /** Work title */
  title?: string;

  /** Publication year */
  year?: number;

  /** URL for web sources */
  url?: string;

  // Corpus-specific fields
  /** Document ID in corpus */
  docId?: string;

  /** Collection name */
  collection?: string;

  /** Start page number */
  page_start?: number;

  /** End page number */
  page_end?: number;

  /** Chunk index within document */
  chunkIndex?: number;

  // Web-specific fields
  /** Domain of the web source */
  domain?: string;

  /** When content was fetched */
  fetchedAt?: Date;

  /** Hash of content for deduplication */
  contentHash?: string;

  // Provenance
  /** Chain of provenance entries */
  provenanceChain?: ProvenanceEntry[];

  // Extensible
  [key: string]: unknown;
}

/**
 * Evidence chunk from any source (corpus, web, or user-provided)
 *
 * This is the unified format for all evidence, regardless of source.
 * Backward compatible with existing ContextChunk type.
 */
export interface EvidenceChunk {
  /** Unique identifier for this evidence */
  id: string;

  /** The actual text content */
  content: string;

  /** Where this evidence came from */
  sourceType: SourceType;

  /** Trust level based on source type */
  trustLevel: TrustLevel;

  /** Relevance score to the query (0-1) */
  relevanceScore: number;

  /** Source-specific metadata */
  metadata: EvidenceMetadata;

  /** When this evidence was retrieved/fetched */
  retrievedAt: Date;

  /** Optional expiration (for web content) */
  expiresAt?: Date;

  /** Optional embedding vector */
  embedding?: number[];
}

// =============================================================================
// Query & Results
// =============================================================================

/**
 * Query options for evidence retrieval
 */
export interface EvidenceQueryOptions {
  /** Maximum chunks to return */
  maxChunks?: number;

  /** Minimum relevance threshold */
  minRelevance?: number;

  /** Filter by source types */
  sourceTypes?: SourceType[];

  /** Minimum trust level required */
  minTrustLevel?: TrustLevel;

  /** Filter by specific authors */
  authors?: string[];

  /** Filter by year range */
  yearRange?: { min?: number; max?: number };

  /** Boost diversity in results */
  diversityBoost?: boolean;

  /** Use re-ranking for better results */
  rerank?: boolean;
}

/**
 * Result of evidence query
 */
export interface EvidenceQueryResult {
  /** Retrieved evidence chunks */
  chunks: EvidenceChunk[];

  /** Query metadata */
  metadata: {
    /** Total chunks searched */
    totalSearched: number;

    /** Whether cache was used */
    cacheHit: boolean;

    /** Query time in milliseconds */
    queryTimeMs: number;

    /** Breakdown by source type */
    sourceBreakdown: Record<SourceType, number>;
  };
}

/**
 * Evidence store statistics
 */
export interface EvidenceStoreStats {
  /** Number of corpus chunks available */
  corpusChunks: number;

  /** Number of web cache entries */
  webCacheEntries: number;

  /** Total queries executed */
  totalQueries: number;

  /** Cache hit rate (0-1) */
  cacheHitRate: number;

  /** Average query time in milliseconds */
  averageQueryTime: number;
}

// =============================================================================
// Validation Configuration
// =============================================================================

/**
 * Policy for trusting web content
 */
export interface WebTrustPolicy {
  /** Trusted domains (full trust, e.g., .edu, .gov, academic journals) */
  trustedDomains?: string[];

  /** Semi-trusted domains (verify if possible) */
  semiTrustedDomains?: string[];

  /** Blocked domains (never use) */
  blockedDomains?: string[];

  /** Default trust level for unknown domains */
  defaultTrust: TrustLevel;

  /** Require HTTPS */
  requireHttps?: boolean;

  /** Maximum age of web content in hours */
  maxContentAgeHours?: number;
}

/**
 * Configuration for universal validation
 */
export interface UniversalValidationConfig {
  /** Validation strictness level */
  strictness: ValidationStrictness;

  /** Validation mode (auto-detected or forced) */
  mode?: ValidationMode;

  /** Minimum citation pass rate (default: based on strictness) */
  minCitationPassRate?: number;

  /** Minimum quote fidelity rate (default: 0.95) */
  minQuoteFidelityRate?: number;

  /** Minimum claim grounding rate (default: based on strictness) */
  minClaimGroundingRate?: number;

  /** Require page numbers for citations */
  requirePageNumbers?: boolean;

  /** Enable quotation fidelity validation */
  validateQuoteFidelity?: boolean;

  /** Enable claim grounding validation */
  validateClaimGrounding?: boolean;

  /** Track provenance for all claims */
  trackProvenance?: boolean;

  /** Web content trust policy */
  webTrustPolicy?: WebTrustPolicy;
}

// =============================================================================
// Validation Results
// =============================================================================

/**
 * Validation issue severity
 */
export type IssueSeverity = 'critical' | 'major' | 'minor' | 'info';

/**
 * Validation issue category
 */
export type IssueCategory = 'citation' | 'quote' | 'claim' | 'grounding' | 'provenance';

/**
 * A validation issue found during validation
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: IssueSeverity;

  /** Issue category */
  category: IssueCategory;

  /** Human-readable message */
  message: string;

  /** Suggestion for fixing */
  suggestion?: string;

  /** Source type where issue was found */
  sourceType?: SourceType;

  /** Line number if applicable */
  line?: number;

  /** Character offset if applicable */
  offset?: number;
}

/**
 * Result of validating a single claim
 */
export interface ClaimValidationResult {
  /** The claim text */
  claim: string;

  /** Whether the claim passed validation */
  passed: boolean;

  /** Evidence that supports this claim */
  supportingEvidence: EvidenceChunk[];

  /** Source type of the primary evidence */
  sourceType: SourceType;

  /** Trust level of the evidence */
  trustLevel: TrustLevel;

  /** Confidence score (0-1) */
  confidence: number;

  /** Validation issues found */
  issues: ValidationIssue[];

  /** Provenance chain */
  provenance: ProvenanceEntry[];
}

/**
 * Result of validating a citation
 */
export interface CitationValidationResult {
  /** The citation text as written */
  raw: string;

  /** Parsed citation components */
  parsed: {
    author?: string;
    year?: number;
    page?: number;
    title?: string;
  };

  /** Whether the citation is valid */
  valid: boolean;

  /** Source type of the matching evidence */
  sourceType?: SourceType;

  /** Matching evidence if found */
  matchedEvidence?: EvidenceChunk;

  /** Reason if invalid */
  reason?: string;

  /** Suggested replacement if hallucinated */
  suggestion?: {
    formatted: string;
    evidence: EvidenceChunk;
  };
}

/**
 * Result of validating a quotation
 */
export interface QuotationValidationResult {
  /** The quoted text */
  quote: string;

  /** Whether the quote is verbatim */
  verbatim: boolean;

  /** Similarity score to best match (0-1) */
  similarityScore: number;

  /** Source type of the matching evidence */
  sourceType?: SourceType;

  /** Matching evidence */
  matchedEvidence?: EvidenceChunk;

  /** Suggested correction if not verbatim */
  suggestedCorrection?: string;
}

/**
 * Overall validation result for a content unit
 */
export interface UniversalValidationResult {
  /** Whether validation passed overall */
  passed: boolean;

  /** Overall quality score (0-1) */
  overallScore: number;

  /** Validation mode used */
  mode: ValidationMode;

  /** Citation validation results */
  citations: {
    total: number;
    valid: number;
    bySourceType: Record<SourceType, number>;
    hallucinated: CitationValidationResult[];
    passRate: number;
  };

  /** Quotation validation results */
  quotations: {
    total: number;
    verbatim: number;
    nonVerbatim: QuotationValidationResult[];
    fidelityRate: number;
  };

  /** Claim validation results */
  claims: {
    total: number;
    grounded: number;
    ungrounded: ClaimValidationResult[];
    groundingRate: number;
    byTrustLevel: Record<TrustLevel, number>;
  };

  /** All issues found */
  issues: ValidationIssue[];

  /** Feedback for regeneration */
  feedback: string[];

  /** Source provenance summary */
  provenance: {
    corpusOnly: number;
    webOnly: number;
    hybrid: number;
    llmKnowledge: number;
  };
}

// =============================================================================
// LLM Tool Types
// =============================================================================

/**
 * Evidence lookup request (used by LLM during generation)
 */
export interface EvidenceLookupRequest {
  /** Natural language query for evidence */
  query: string;

  /** Type of claim being made */
  claimType: 'factual' | 'interpretive' | 'methodological' | 'theoretical' | 'synthesis';

  /** Preferred source types (default: all available) */
  preferredSources?: SourceType[];

  /** Preferred authors */
  preferredAuthors?: string[];

  /** Maximum results */
  maxResults?: number;

  /** Minimum relevance */
  minRelevance?: number;
}

/**
 * Evidence lookup result
 */
export interface EvidenceLookupResult {
  /** Evidence found */
  evidence: EvidenceChunk[];

  /** Usable quotations */
  quotations: Array<{
    text: string;
    source: EvidenceChunk;
    page?: number;
  }>;

  /** Suggested claim framings */
  suggestedFramings: string[];

  /** Whether sufficient evidence was found */
  hasAdequateEvidence: boolean;

  /** Source breakdown */
  sourceBreakdown: Record<SourceType, number>;

  /** Warning if relying on lower-trust sources */
  trustWarning?: string;
}

// =============================================================================
// Provenance Tracking
// =============================================================================

/**
 * A tracked claim with full provenance
 */
export interface TrackedClaim {
  /** Unique claim ID */
  id: string;

  /** The claim text */
  text: string;

  /** Document position (line, paragraph, section) */
  position: {
    line?: number;
    paragraph?: number;
    section?: string;
  };

  /** Primary source */
  primarySource: EvidenceChunk;

  /** Supporting sources */
  supportingSources: EvidenceChunk[];

  /** Source type */
  sourceType: SourceType;

  /** Validation status */
  validationStatus: 'verified' | 'semi_verified' | 'unverified' | 'rejected';

  /** Full provenance chain */
  provenance: ProvenanceEntry[];

  /** Created timestamp */
  createdAt: Date;
}

/**
 * Provenance report structure
 */
export interface ProvenanceReport {
  /** Total claims tracked */
  totalClaims: number;

  /** Breakdown by source type */
  bySourceType: Record<SourceType, number>;

  /** Breakdown by validation status */
  byValidationStatus: Record<string, number>;

  /** Claims by section */
  bySection: Record<string, string[]>;

  /** Summary of all claims */
  claims: Array<{
    id: string;
    text: string;
    sourceType: SourceType;
    validationStatus: string;
    sourceSummary: string;
  }>;
}

// =============================================================================
// Default Values
// =============================================================================

/**
 * Default thresholds by strictness level
 */
export const STRICTNESS_THRESHOLDS: Record<ValidationStrictness, {
  minCitationPassRate: number;
  minQuoteFidelityRate: number;
  minClaimGroundingRate: number;
  overallPassThreshold: number;
}> = {
  strict: {
    minCitationPassRate: 1.0,
    minQuoteFidelityRate: 0.95,
    minClaimGroundingRate: 0.9,
    overallPassThreshold: 0.95,
  },
  moderate: {
    minCitationPassRate: 0.9,
    minQuoteFidelityRate: 0.9,
    minClaimGroundingRate: 0.8,
    overallPassThreshold: 0.85,
  },
  relaxed: {
    minCitationPassRate: 0.8,
    minQuoteFidelityRate: 0.8,
    minClaimGroundingRate: 0.7,
    overallPassThreshold: 0.75,
  },
};

/**
 * Default trust levels by source type
 */
export const DEFAULT_TRUST_LEVELS: Record<SourceType, TrustLevel> = {
  corpus: 'verified',
  web: 'unverified',
  llm_knowledge: 'unverified',
  user_provided: 'semi_verified',
};

/**
 * Default web trust policy
 */
export const DEFAULT_WEB_TRUST_POLICY: WebTrustPolicy = {
  trustedDomains: [
    'scholar.google.com',
    'pubmed.ncbi.nlm.nih.gov',
    'arxiv.org',
    'jstor.org',
    'plato.stanford.edu',
    'iep.utm.edu',
    '.edu',
    '.gov',
  ],
  semiTrustedDomains: [
    'wikipedia.org',
    'britannica.com',
    'mit.edu',
    'stanford.edu',
    'harvard.edu',
  ],
  blockedDomains: [
    'pinterest.com',
    'quora.com',
    'reddit.com',
    'facebook.com',
    'twitter.com',
    'x.com',
  ],
  defaultTrust: 'unverified',
  requireHttps: true,
  maxContentAgeHours: 24,
};

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: UniversalValidationConfig = {
  strictness: 'moderate',
  mode: undefined, // Auto-detect
  minCitationPassRate: undefined, // Use strictness default
  minQuoteFidelityRate: undefined, // Use strictness default
  minClaimGroundingRate: undefined, // Use strictness default
  requirePageNumbers: false,
  validateQuoteFidelity: true,
  validateClaimGrounding: true,
  trackProvenance: true,
  webTrustPolicy: DEFAULT_WEB_TRUST_POLICY,
};

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if a source type is corpus-based
 */
export function isCorpusSource(sourceType: SourceType): boolean {
  return sourceType === 'corpus';
}

/**
 * Check if a source type is web-based
 */
export function isWebSource(sourceType: SourceType): boolean {
  return sourceType === 'web';
}

/**
 * Check if trust level is sufficient for strict validation
 */
export function isVerifiedTrust(trustLevel: TrustLevel): boolean {
  return trustLevel === 'verified';
}

/**
 * Get validation thresholds for a strictness level
 */
export function getThresholds(strictness: ValidationStrictness) {
  return STRICTNESS_THRESHOLDS[strictness];
}

/**
 * Determine trust level from source type (default mapping)
 */
export function getTrustLevelForSource(sourceType: SourceType): TrustLevel {
  return DEFAULT_TRUST_LEVELS[sourceType];
}
