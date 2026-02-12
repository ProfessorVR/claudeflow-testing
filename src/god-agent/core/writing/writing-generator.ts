/**
 * Writing Generator Interface (SPEC-WRT-001)
 *
 * Defines the contract for LLM-based writing generation.
 */

/**
 * Corpus source for citation constraint enforcement (Phase 1: Hallucination Prevention)
 */
export interface CorpusSource {
  /** Author name(s) */
  author: string;
  /** Publication year */
  year: number;
  /** Work title */
  title: string;
  /** Available page range(s) */
  pages?: string;
  /** Document ID in corpus (for traceability) */
  docId?: string;
  /** Short citation key (e.g., "Frede 1992") */
  citationKey?: string;
}

/**
 * Corpus constraint configuration for hallucination prevention
 */
export interface CorpusConstraint {
  /** List of verified corpus sources that may be cited */
  sources: CorpusSource[];
  /** Enforcement level */
  enforcement: 'strict' | 'warn' | 'off';
  /** Placeholder text to use when citation needed but not available */
  missingCitationPlaceholder?: string;
}

export interface IWriteRequest {
  /** Document title */
  title: string;

  /** Document description/requirements */
  description: string;

  /** Style profile name (optional) */
  style?: string;

  /** Section outline (optional) */
  outline?: string[];

  /** Additional context from InteractionStore (optional) */
  context?: string;

  /** Maximum word count (optional) */
  maxLength?: number;

  /** Output format */
  format?: 'markdown' | 'html' | 'plain';

  /** Writing tone */
  tone?: 'formal' | 'casual' | 'technical' | 'narrative';

  /** Corpus constraint for citation hallucination prevention (Phase 1) */
  corpusConstraint?: CorpusConstraint;
}

/**
 * Regional transformation metadata
 */
export interface RegionalTransformationMetadata {
  /** Language variant applied */
  variant: 'en-US' | 'en-GB';
  /** Number of spelling changes made */
  spellingChanges: number;
  /** Number of grammar changes made */
  grammarChanges: number;
  /** Array of rule IDs that were applied */
  rulesApplied: string[];
}

export interface IWriteResult {
  /** Generated content */
  content: string;

  /** Structured sections (optional) */
  sections?: Array<{ heading: string; content: string }>;

  /** Actual word count */
  wordCount: number;

  /** Quality assessment score (0-1) */
  qualityScore: number;

  /** Generation metadata */
  metadata: {
    /** Model used for generation */
    model: string;

    /** Total tokens consumed */
    tokensUsed: number;

    /** Generation latency in milliseconds */
    latencyMs: number;

    /** Whether style profile was applied */
    styleApplied: boolean;

    /** Regional transformation metadata (optional) */
    regionalTransformations?: RegionalTransformationMetadata;
  };
}

export interface IWritingGenerator {
  /**
   * Generate complete document content
   */
  generate(request: IWriteRequest): Promise<IWriteResult>;

  /**
   * Generate a single section
   */
  generateSection(heading: string, context: string, style?: string): Promise<string>;

  /**
   * Get list of supported style profiles
   */
  getSupportedStyles(): string[];
}
