/**
 * Typed Entailment Relations - Core Type Definitions
 *
 * This module defines the fundamental types for classifying claim-evidence
 * relationships in scholarly writing. Each entailment type represents a
 * distinct inferential relationship with specific validation requirements.
 *
 * @module entailment-types
 */

// =============================================================================
// ENTAILMENT RELATION TYPES
// =============================================================================

/**
 * Entailment Relation Types
 *
 * Each type represents a distinct inferential relationship between
 * a claim and its supporting evidence.
 */
export type EntailmentRelationType =
  | 'textual' // Near-quotation: claim closely matches source text
  | 'paraphrastic' // Same content, different wording
  | 'conceptual' // Same concept, different vocabulary/framework
  | 'inferential' // Conclusion drawn from explicit premises
  | 'analogical' // Cross-framework or cross-domain mapping
  | 'evaluative'; // Value judgment requiring argumentative support

/**
 * Enum version for pattern matching and switch statements
 */
export const EntailmentRelationTypeEnum = {
  TEXTUAL: 'textual' as const,
  PARAPHRASTIC: 'paraphrastic' as const,
  CONCEPTUAL: 'conceptual' as const,
  INFERENTIAL: 'inferential' as const,
  ANALOGICAL: 'analogical' as const,
  EVALUATIVE: 'evaluative' as const,
} as const;

// =============================================================================
// ENTAILMENT RELATION
// =============================================================================

/**
 * Entailment relation with confidence and evidence
 */
export interface EntailmentRelation {
  /** The type of entailment relation */
  type: EntailmentRelationType;

  /** Confidence in the relation classification (0-1) */
  confidence: number;

  /** The specific evidence supporting this relation */
  evidence: EntailmentEvidence;

  /** Sub-relations for complex entailments */
  subRelations?: EntailmentRelation[];
}

// =============================================================================
// EVIDENCE TYPES
// =============================================================================

/**
 * Evidence supporting an entailment relation
 */
export interface EntailmentEvidence {
  /** Source text or chunk supporting the claim */
  sourceText: string;

  /** Source metadata (author, work, page) */
  sourceMetadata: SourceMetadata;

  /** Specific markers or indicators for this relation type */
  markers: EntailmentMarker[];

  /** Computed metrics specific to relation type */
  metrics: RelationMetrics;
}

/**
 * Source metadata for evidence
 */
export interface SourceMetadata {
  /** Author name */
  author: string;

  /** Work title */
  work?: string;

  /** Publication year */
  year?: number;

  /** Page number or range */
  page?: number | string;

  /** Section or chapter reference */
  section?: string;

  /** Internal chunk identifier */
  chunkId?: string;
}

// =============================================================================
// MARKERS
// =============================================================================

/**
 * Marker types that indicate entailment relations
 */
export type MarkerType = 'lexical' | 'syntactic' | 'semantic' | 'logical' | 'rhetorical';

/**
 * Markers that indicate entailment type
 */
export interface EntailmentMarker {
  /** Type of marker */
  type: MarkerType;

  /** The marker text or pattern */
  value: string;

  /** Position in claim */
  claimPosition?: TextPosition;

  /** Position in evidence */
  evidencePosition?: TextPosition;

  /** Strength of this marker (0-1) */
  strength: number;
}

/**
 * Text position information
 */
export interface TextPosition {
  /** Start character index */
  start: number;

  /** End character index */
  end: number;

  /** Line number (if applicable) */
  line?: number;
}

// =============================================================================
// METRICS
// =============================================================================

/**
 * Metrics computed for relation validation
 *
 * Different entailment types use different metrics as their primary
 * validation measure.
 */
export interface RelationMetrics {
  /** Lexical overlap ratio (for textual/paraphrastic) */
  lexicalOverlap?: number;

  /** Semantic similarity score (for conceptual) */
  semanticSimilarity?: number;

  /** Premise coverage (for inferential) */
  premiseCoverage?: number;

  /** Bridge explicitness (for analogical) */
  bridgeExplicitness?: number;

  /** Argument presence score (for evaluative) */
  argumentPresence?: number;

  /** Term alignment score (for conceptual) */
  termAlignment?: number;

  /** Content preservation score (for paraphrastic) */
  contentPreservation?: number;

  /** Longest common substring length */
  longestCommonSubstring?: number;
}

/**
 * Primary metrics used for each entailment type
 */
export const PRIMARY_METRICS: Record<EntailmentRelationType, keyof RelationMetrics> = {
  textual: 'lexicalOverlap',
  paraphrastic: 'semanticSimilarity',
  conceptual: 'termAlignment',
  inferential: 'premiseCoverage',
  analogical: 'bridgeExplicitness',
  evaluative: 'argumentPresence',
};

// =============================================================================
// ENTAILMENT PROFILE
// =============================================================================

/**
 * Entailment profile for a claim
 */
export interface EntailmentProfile {
  /** Primary entailment relation */
  primary: EntailmentRelation;

  /** Secondary/supporting entailment relations */
  secondary: EntailmentRelation[];

  /** Overall entailment strength (computed) */
  overallStrength: number;

  /** Whether claim meets entailment requirements */
  meetsRequirements: boolean;

  /** Unmet requirements if any */
  unmetRequirements: string[];
}

// =============================================================================
// CLASSIFICATION CONTEXT
// =============================================================================

/**
 * Context for entailment classification
 */
export interface EntailmentClassificationContext {
  /** The claim text */
  claimText: string;

  /** Available evidence chunks */
  evidenceChunks: ContextChunk[];

  /** Known terminology mappings */
  terminologyMap?: Map<string, string[]>;

  /** Surrounding discourse context */
  discourseContext?: string;

  /** Known authors in the corpus */
  knownAuthors?: string[];
}

/**
 * Evidence chunk from corpus
 */
export interface ContextChunk {
  /** Chunk identifier */
  id: string;

  /** Chunk content */
  content: string;

  /** Chunk metadata */
  metadata?: ChunkMetadata;

  /** Relevance score from retrieval */
  relevanceScore?: number;
}

/**
 * Metadata for a context chunk
 */
export interface ChunkMetadata {
  author?: string;
  work?: string;
  year?: number;
  page?: number | string;
  section?: string;
  [key: string]: unknown;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Classification result with multiple possible relations
 */
export interface EntailmentClassificationResult {
  /** All detected relations sorted by confidence */
  relations: EntailmentRelation[];

  /** Primary (highest confidence) relation */
  primary: EntailmentRelation | null;

  /** Classification metadata */
  metadata: ClassificationMetadata;
}

/**
 * Metadata about the classification process
 */
export interface ClassificationMetadata {
  /** Time taken to classify (ms) */
  classificationTimeMs: number;

  /** Number of evidence chunks processed */
  chunksProcessed: number;

  /** Number of patterns matched */
  patternsMatched: number;

  /** Whether embeddings were used */
  usedEmbeddings: boolean;
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if a value is a valid EntailmentRelationType
 */
export function isEntailmentRelationType(value: unknown): value is EntailmentRelationType {
  return (
    typeof value === 'string' &&
    ['textual', 'paraphrastic', 'conceptual', 'inferential', 'analogical', 'evaluative'].includes(
      value
    )
  );
}

/**
 * Check if an object is an EntailmentRelation
 */
export function isEntailmentRelation(value: unknown): value is EntailmentRelation {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    isEntailmentRelationType(obj.type) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 1 &&
    isEntailmentEvidence(obj.evidence)
  );
}

/**
 * Check if an object is EntailmentEvidence
 */
export function isEntailmentEvidence(value: unknown): value is EntailmentEvidence {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.sourceText === 'string' &&
    isSourceMetadata(obj.sourceMetadata) &&
    Array.isArray(obj.markers) &&
    typeof obj.metrics === 'object'
  );
}

/**
 * Check if an object is SourceMetadata
 */
export function isSourceMetadata(value: unknown): value is SourceMetadata {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return typeof obj.author === 'string';
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a default EntailmentRelation
 */
export function createDefaultEntailmentRelation(
  type: EntailmentRelationType = 'textual'
): EntailmentRelation {
  return {
    type,
    confidence: 0,
    evidence: {
      sourceText: '',
      sourceMetadata: { author: 'unknown' },
      markers: [],
      metrics: {},
    },
  };
}

/**
 * Create an EntailmentRelation from partial data
 */
export function createEntailmentRelation(
  partial: Partial<EntailmentRelation> & { type: EntailmentRelationType }
): EntailmentRelation {
  const defaults = createDefaultEntailmentRelation(partial.type);
  return {
    ...defaults,
    ...partial,
    evidence: {
      ...defaults.evidence,
      ...(partial.evidence || {}),
      sourceMetadata: {
        ...defaults.evidence.sourceMetadata,
        ...(partial.evidence?.sourceMetadata || {}),
      },
      markers: partial.evidence?.markers || defaults.evidence.markers,
      metrics: {
        ...defaults.evidence.metrics,
        ...(partial.evidence?.metrics || {}),
      },
    },
  };
}

/**
 * Create a default EntailmentProfile
 */
export function createDefaultEntailmentProfile(): EntailmentProfile {
  return {
    primary: createDefaultEntailmentRelation(),
    secondary: [],
    overallStrength: 0,
    meetsRequirements: false,
    unmetRequirements: [],
  };
}

/**
 * Create an EntailmentMarker
 */
export function createEntailmentMarker(
  type: MarkerType,
  value: string,
  strength: number,
  positions?: { claim?: TextPosition; evidence?: TextPosition }
): EntailmentMarker {
  return {
    type,
    value,
    strength: Math.max(0, Math.min(1, strength)),
    claimPosition: positions?.claim,
    evidencePosition: positions?.evidence,
  };
}
