/**
 * Universal Validation Interfaces
 *
 * Core interfaces for the universal inline citation/claim validation system.
 * These interfaces define the contracts that implementations must follow.
 *
 * @module core/validation/interfaces
 */

import type {
  EvidenceChunk,
  EvidenceQueryOptions,
  EvidenceQueryResult,
  EvidenceStoreStats,
  EvidenceMetadata,
  SourceType,
  TrustLevel,
  UniversalValidationConfig,
  UniversalValidationResult,
  ClaimValidationResult,
  CitationValidationResult,
  QuotationValidationResult,
  ValidationMode,
  EvidenceLookupRequest,
  EvidenceLookupResult,
  ProvenanceReport,
  TrackedClaim,
} from './types.js';

// =============================================================================
// Evidence Store Interface
// =============================================================================

/**
 * Universal Evidence Store Interface
 *
 * Provides a unified interface for retrieving evidence from:
 * - Local corpus (ChromaDB knowledge_chunks)
 * - Web search results (cached)
 * - User-provided sources
 *
 * Implementations should handle caching, deduplication, and trust level assignment.
 */
export interface IUniversalEvidenceStore {
  /**
   * Query for evidence across all configured sources
   *
   * @param query - Natural language search query
   * @param options - Query configuration
   * @returns Evidence chunks with metadata
   */
  query(query: string, options?: EvidenceQueryOptions): Promise<EvidenceQueryResult>;

  /**
   * Add web content as temporary evidence
   *
   * Web evidence is cached with expiration and treated as lower-trust
   * unless the domain is in the trusted list.
   *
   * @param url - Source URL
   * @param content - Text content from the URL
   * @param metadata - Additional metadata
   * @returns Created evidence chunk
   */
  addWebEvidence(
    url: string,
    content: string,
    metadata: Partial<EvidenceMetadata>
  ): Promise<EvidenceChunk>;

  /**
   * Check if an author exists in the store
   *
   * @param author - Author name to check
   * @returns True if author has evidence in the store
   */
  hasAuthor(author: string): Promise<boolean>;

  /**
   * Get all available authors by source type
   *
   * @param sourceType - Filter by source type (optional)
   * @returns Array of author names
   */
  getAvailableAuthors(sourceType?: SourceType): Promise<string[]>;

  /**
   * Get specific chunk by ID
   *
   * @param id - Evidence chunk ID
   * @returns Evidence chunk or null if not found
   */
  getChunkById(id: string): Promise<EvidenceChunk | null>;

  /**
   * Clear web evidence cache
   *
   * Removes all cached web content. Corpus content is not affected.
   */
  clearWebCache(): void;

  /**
   * Get statistics about the evidence store
   *
   * @returns Store statistics
   */
  getStats(): EvidenceStoreStats;

  /**
   * Get evidence by author
   *
   * @param author - Author name
   * @param options - Query options
   * @returns Evidence chunks from this author
   */
  getByAuthor(author: string, options?: EvidenceQueryOptions): Promise<EvidenceChunk[]>;

  /**
   * Search for evidence by year range
   *
   * @param minYear - Minimum publication year
   * @param maxYear - Maximum publication year
   * @param options - Query options
   * @returns Evidence chunks in year range
   */
  getByYearRange(
    minYear: number,
    maxYear: number,
    options?: EvidenceQueryOptions
  ): Promise<EvidenceChunk[]>;
}

// =============================================================================
// Validation Layer Interface
// =============================================================================

/**
 * Universal Validation Layer Interface
 *
 * Validates content against any combination of sources:
 * - Corpus-only: Traditional academic validation
 * - Web-only: Validate against fetched web content
 * - Hybrid: Validate against both, track provenance
 *
 * The validation layer is stateless - it uses the evidence store for lookups.
 */
export interface IUniversalValidationLayer {
  /**
   * Validate a content unit (paragraph, section, etc.)
   *
   * Performs full validation including:
   * - Citation validation (author, year, existence)
   * - Quote fidelity (verbatim checking)
   * - Claim grounding (evidence support)
   *
   * @param content - Content to validate
   * @param config - Validation configuration (overrides defaults)
   * @returns Comprehensive validation result
   */
  validate(
    content: string,
    config?: Partial<UniversalValidationConfig>
  ): Promise<UniversalValidationResult>;

  /**
   * Quick citation-only validation
   *
   * Faster than full validation - only checks citations.
   * Useful for preliminary checks during generation.
   *
   * @param content - Content to validate
   * @returns Citation validation summary
   */
  validateCitationsOnly(content: string): Promise<{
    passed: boolean;
    hallucinated: string[];
    passRate: number;
  }>;

  /**
   * Validate a single claim against available evidence
   *
   * @param claim - Claim text to validate
   * @param attributedAuthor - Author the claim is attributed to (optional)
   * @returns Claim validation result
   */
  validateClaim(
    claim: string,
    attributedAuthor?: string
  ): Promise<ClaimValidationResult>;

  /**
   * Check if a citation is valid
   *
   * @param citation - Citation text (e.g., "Frede, 1992")
   * @returns Citation validation result with suggestions if invalid
   */
  validateCitation(citation: string): Promise<CitationValidationResult>;

  /**
   * Verify a quotation against evidence
   *
   * Checks if the quote exists verbatim in the evidence store.
   *
   * @param quote - Quote text to verify
   * @param attributedAuthor - Author the quote is attributed to (optional)
   * @returns Quotation validation result with correction if not verbatim
   */
  validateQuotation(
    quote: string,
    attributedAuthor?: string
  ): Promise<QuotationValidationResult>;

  /**
   * Get available authors from all sources
   *
   * @returns Array of author names that can be cited
   */
  getAvailableAuthors(): Promise<string[]>;

  /**
   * Format validation result as feedback for regeneration
   *
   * Creates a human-readable prompt that can be given to the LLM
   * to help it fix validation issues.
   *
   * @param result - Validation result to format
   * @returns Formatted feedback string
   */
  formatFeedback(result: UniversalValidationResult): string;

  /**
   * Get current validation mode
   *
   * @returns Current validation mode (corpus_only, web_only, hybrid, llm_only)
   */
  getMode(): ValidationMode;

  /**
   * Get current configuration
   *
   * @returns Current validation configuration
   */
  getConfig(): UniversalValidationConfig;

  /**
   * Update configuration
   *
   * @param config - Partial configuration to merge with current
   */
  updateConfig(config: Partial<UniversalValidationConfig>): void;
}

// =============================================================================
// Evidence Lookup Tool Interface
// =============================================================================

/**
 * Evidence Lookup Tool Interface
 *
 * Tool-use interface that allows the LLM to query evidence
 * BEFORE making claims during generation. This is the key
 * mechanism for preventing hallucinations inline.
 */
export interface IEvidenceLookupTool {
  /**
   * Execute evidence lookup
   *
   * @param request - Lookup request with query and preferences
   * @returns Evidence found with usage suggestions
   */
  lookup(request: EvidenceLookupRequest): Promise<EvidenceLookupResult>;

  /**
   * Check if an author exists in available evidence
   *
   * @param author - Author name to check
   * @returns True if author has evidence available
   */
  hasAuthor(author: string): boolean;

  /**
   * Get all available authors
   *
   * @returns Array of author names
   */
  getAvailableAuthors(): string[];

  /**
   * Get evidence chunks for a specific author
   *
   * @param author - Author name
   * @returns Evidence chunks from this author
   */
  getAuthorEvidence(author: string): EvidenceChunk[];

  /**
   * Format lookup result for LLM consumption
   *
   * Creates a formatted string suitable for including
   * in an LLM prompt or tool response.
   *
   * @param result - Lookup result to format
   * @returns Formatted string
   */
  formatForLLM(result: EvidenceLookupResult): string;
}

// =============================================================================
// Provenance Ledger Interface
// =============================================================================

/**
 * Provenance Ledger Interface
 *
 * Tracks the source of every claim in generated content.
 * Provides full traceability from claim to original evidence.
 */
export interface IProvenanceLedger {
  /**
   * Track a new claim
   *
   * @param claimText - The claim text
   * @param source - Primary evidence source
   * @param position - Position in document (optional)
   * @returns Claim ID for reference
   */
  track(
    claimText: string,
    source: EvidenceChunk,
    position?: TrackedClaim['position']
  ): string;

  /**
   * Add supporting evidence to a claim
   *
   * @param claimId - Claim ID
   * @param source - Supporting evidence
   */
  addSupportingEvidence(claimId: string, source: EvidenceChunk): void;

  /**
   * Get a tracked claim by ID
   *
   * @param claimId - Claim ID
   * @returns Tracked claim or null
   */
  getClaim(claimId: string): TrackedClaim | null;

  /**
   * Get all claims for a section
   *
   * @param section - Section name
   * @returns Tracked claims in this section
   */
  getClaimsBySection(section: string): TrackedClaim[];

  /**
   * Get all claims citing a source
   *
   * @param sourceId - Source ID
   * @returns Tracked claims citing this source
   */
  getClaimsBySource(sourceId: string): TrackedClaim[];

  /**
   * Generate provenance report
   *
   * @returns Full provenance report
   */
  generateReport(): ProvenanceReport;

  /**
   * Export ledger to JSON
   *
   * @returns JSON string
   */
  export(): string;

  /**
   * Import ledger from JSON
   *
   * @param json - JSON string
   */
  import(json: string): void;

  /**
   * Clear all tracked claims
   */
  clear(): void;
}

// =============================================================================
// Web Evidence Provider Interface
// =============================================================================

/**
 * Web Evidence Provider Interface
 *
 * Fetches, caches, and manages web content as evidence.
 */
export interface IWebEvidenceProvider {
  /**
   * Search the web for evidence
   *
   * @param query - Search query
   * @param options - Search options
   * @returns Evidence chunks from web search
   */
  searchWeb(
    query: string,
    options?: {
      maxResults?: number;
      domains?: string[];
    }
  ): Promise<EvidenceChunk[]>;

  /**
   * Fetch content from a specific URL
   *
   * @param url - URL to fetch
   * @returns Evidence chunk or null if failed
   */
  fetchUrl(url: string): Promise<EvidenceChunk | null>;

  /**
   * Check if URL is cached
   *
   * @param url - URL to check
   * @returns True if cached and not expired
   */
  isCached(url: string): boolean;

  /**
   * Get cached chunk for URL
   *
   * @param url - URL to get
   * @returns Cached evidence chunk or null
   */
  getCached(url: string): EvidenceChunk | null;

  /**
   * Clear expired cache entries
   *
   * @returns Number of entries cleared
   */
  clearExpired(): number;

  /**
   * Clear all cache
   */
  clearAll(): void;

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    hitRate: number;
    totalFetches: number;
  };
}

// =============================================================================
// Inline Validation Orchestrator Interface
// =============================================================================

/**
 * Generation unit for inline validation
 */
export interface GenerationUnit {
  /** Unit type */
  type: 'introduction' | 'paragraph' | 'claim' | 'argument' | 'evidence' | 'transition' | 'conclusion' | 'synthesis';

  /** What this unit should accomplish */
  intent: string;

  /** Key topics/concepts to address */
  topics: string[];

  /** Suggested length in words */
  targetWords?: number;

  /** Required sources (must cite these) */
  requiredSources?: string[];

  /** Section this belongs to */
  section?: string;
}

/**
 * Validated unit result
 */
export interface ValidatedUnit {
  /** The generated content */
  content: string;

  /** The original generation unit */
  unit: GenerationUnit;

  /** Citations used */
  citations: Array<{
    author: string;
    year?: number;
    page?: number;
  }>;

  /** Quotes used */
  quotes: Array<{
    text: string;
    author: string;
  }>;

  /** Validation result */
  validationResult: UniversalValidationResult;

  /** Number of attempts before passing */
  attempts: number;
}

/**
 * Inline generation result
 */
export interface InlineGenerationResult {
  /** The assembled document */
  document: string;

  /** All validated units */
  units: ValidatedUnit[];

  /** Overall statistics */
  stats: {
    totalUnits: number;
    passedFirstAttempt: number;
    passedAfterRetry: number;
    failed: number;
    totalAttempts: number;
    avgAttemptsPerUnit: number;
  };

  /** Units that failed all retries */
  failedUnits: Array<{
    unit: GenerationUnit;
    lastValidationResult: UniversalValidationResult;
    placeholder: string;
  }>;

  /** Whether all units passed */
  allPassed: boolean;

  /** Overall quality score */
  qualityScore: number;
}

/**
 * Inline Validation Orchestrator Interface
 *
 * Coordinates paragraph-by-paragraph generation with inline validation gates.
 * Each paragraph is validated BEFORE being added to the output document.
 */
export interface IInlineValidationOrchestrator {
  /**
   * Generate document with inline validation
   *
   * @param topic - Document topic
   * @param outline - Generation units (paragraphs/sections)
   * @param systemPrompt - Additional system prompt (optional)
   * @returns Generation result with validation stats
   */
  generateWithInlineValidation(
    topic: string,
    outline: GenerationUnit[],
    systemPrompt?: string
  ): Promise<InlineGenerationResult>;

  /**
   * Create a basic outline from topic
   *
   * @param topic - Document topic
   * @param sections - Section titles
   * @param wordsPerSection - Target words per section
   * @returns Generation units
   */
  createBasicOutline(
    topic: string,
    sections: string[],
    wordsPerSection?: number
  ): GenerationUnit[];

  /**
   * Get available authors from evidence
   *
   * @returns Array of author names
   */
  getAvailableAuthors(): string[];
}

// =============================================================================
// Agent Prompt Injector Interface
// =============================================================================

/**
 * Agent Prompt Injector Interface
 *
 * Builds validation context for agent prompts.
 */
export interface IAgentPromptInjector {
  /**
   * Build validation prompt for agent
   *
   * @param mode - Validation mode
   * @param config - Validation configuration
   * @param availableEvidence - Evidence chunks available
   * @returns Prompt string to inject
   */
  buildValidationPrompt(
    mode: ValidationMode,
    config: UniversalValidationConfig,
    availableEvidence: EvidenceChunk[]
  ): string;

  /**
   * Build source list for agent
   *
   * @param evidence - Evidence chunks
   * @returns Formatted source list
   */
  buildSourceList(evidence: EvidenceChunk[]): string;

  /**
   * Build validation rules for agent
   *
   * @param config - Validation configuration
   * @returns Formatted rules string
   */
  buildValidationRules(config: UniversalValidationConfig): string;
}

// =============================================================================
// Factory Functions (for dependency injection)
// =============================================================================

/**
 * Factory for creating evidence store instances
 */
export type EvidenceStoreFactory = (config?: {
  chromaDbUrl?: string;
  embeddingApiUrl?: string;
  collectionId?: string;
}) => IUniversalEvidenceStore;

/**
 * Factory for creating validation layer instances
 */
export type ValidationLayerFactory = (
  evidenceStore: IUniversalEvidenceStore,
  config?: Partial<UniversalValidationConfig>
) => IUniversalValidationLayer;

/**
 * Factory for creating provenance ledger instances
 */
export type ProvenanceLedgerFactory = () => IProvenanceLedger;

/**
 * Factory for creating web evidence provider instances
 */
export type WebEvidenceProviderFactory = (config?: {
  maxCacheSize?: number;
  cacheTtlMinutes?: number;
  trustPolicy?: import('./types.js').WebTrustPolicy;
}) => IWebEvidenceProvider;
