/**
 * Prompt Decomposer — Hybrid LLM + Deterministic Validation
 *
 * Takes a user prompt and produces a PromptSpec with validated facets.
 *
 * Algorithm:
 *   1. LLM proposes facets, retrieval lexicon, success criteria
 *   2. Deterministic filter validates each facet (at least one retrieval hit)
 *   3. Low-evidence facets auto-demoted to optional_facets[]
 *   4. Reuse extractKeyPointsFromTopic() as fallback for simple prompts
 *
 * @module prompt-decomposer
 */

import { randomUUID } from 'crypto';
import type {
  PromptSpec,
  Facet,
  FacetRole,
  AtomKind,
  EvidenceRequirement,
  AtomsMode,
  ReverseCheckMode,
} from './icp-types.js';
import { defaultEvidenceRequirement } from './icp-types.js';
import type { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface PromptDecomposerConfig {
  /** Minimum retrieval hits for a facet to be "required" */
  minRetrievalHits?: number;
  /** Whether to run in interactive mode (user confirms facets) */
  interactive?: boolean;
  /** Default atoms mode for new facets */
  defaultAtomsMode?: AtomsMode;
  /** Default reverse check mode for new facets */
  defaultReverseCheckMode?: ReverseCheckMode;
  /** Default strictness for facets */
  defaultStrictness?: 'strict' | 'moderate' | 'permissive';
}

const DEFAULT_CONFIG: Required<PromptDecomposerConfig> = {
  minRetrievalHits: 1,
  interactive: false,
  defaultAtomsMode: 'analytics',
  defaultReverseCheckMode: 'warn',
  defaultStrictness: 'strict',
};

// =============================================================================
// LLM-PROPOSED FACET (raw, before validation)
// =============================================================================

export interface ProposedFacet {
  name: string;
  description: string;
  role: FacetRole;
  retrieval_terms: string[];
  success_criteria: string;
}

export interface LLMDecompositionResult {
  research_questions: string[];
  facets: ProposedFacet[];
  retrieval_lexicon: Record<string, string[]>;
}

/**
 * LLM decomposition provider — abstraction over the actual LLM call.
 * Can be mocked for testing.
 */
export interface LLMDecompositionProvider {
  decompose(prompt: string): Promise<LLMDecompositionResult>;
}

// =============================================================================
// PROMPT DECOMPOSER
// =============================================================================

export class PromptDecomposer {
  private readonly config: Required<PromptDecomposerConfig>;
  private readonly retrieval: SmartRetrievalLayer;
  private readonly llm?: LLMDecompositionProvider;

  constructor(
    retrieval: SmartRetrievalLayer,
    llm?: LLMDecompositionProvider,
    config: PromptDecomposerConfig = {},
  ) {
    this.retrieval = retrieval;
    this.llm = llm;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Decompose a user prompt into a validated PromptSpec.
   */
  async decompose(prompt: string): Promise<PromptSpec> {
    // Step 1: Get facet proposals (LLM or fallback)
    const proposal = this.llm
      ? await this.llm.decompose(prompt)
      : this.fallbackDecompose(prompt);

    // Step 2: Validate each facet against corpus retrieval
    const required: Facet[] = [];
    const optional: Facet[] = [];
    const retrievalLexicon = new Map<string, string[]>();
    const successCriteria = new Map<string, string>();

    for (const proposed of proposal.facets) {
      const facet = this.createFacet(proposed);
      const terms = proposed.retrieval_terms;
      retrievalLexicon.set(facet.facet_id, terms);
      successCriteria.set(facet.facet_id, proposed.success_criteria);

      // Validate: at least one retrieval hit
      const hasEvidence = await this.validateFacetEvidence(terms);

      if (hasEvidence) {
        required.push(facet);
      } else {
        optional.push(facet);
      }
    }

    return {
      original_prompt: prompt,
      research_questions: proposal.research_questions,
      required_facets: required,
      optional_facets: optional,
      retrieval_lexicon: retrievalLexicon,
      success_criteria: successCriteria,
    };
  }

  /**
   * Fallback decomposition for simple prompts (no LLM).
   * Extracts key points and creates basic facets.
   */
  private fallbackDecompose(prompt: string): LLMDecompositionResult {
    const keyPoints = this.extractKeyPointsFromTopic(prompt);
    const facets: ProposedFacet[] = keyPoints.map((point, i) => ({
      name: point.slice(0, 60),
      description: point,
      role: i === 0 ? 'core' as FacetRole : 'supporting' as FacetRole,
      retrieval_terms: this.extractTerms(point),
      success_criteria: `Address: ${point}`,
    }));

    // If no key points found, create a single facet from the whole prompt
    if (facets.length === 0) {
      facets.push({
        name: prompt.slice(0, 60),
        description: prompt,
        role: 'core',
        retrieval_terms: this.extractTerms(prompt),
        success_criteria: `Address the research question: ${prompt}`,
      });
    }

    return {
      research_questions: [prompt],
      facets,
      retrieval_lexicon: Object.fromEntries(
        facets.map(f => [f.name, f.retrieval_terms]),
      ),
    };
  }

  /**
   * Extract key points from a topic string.
   * Reuses logic from WritePipelineOrchestrator.extractKeyPointsFromTopic().
   */
  private extractKeyPointsFromTopic(topic: string): string[] {
    // Try numbered lists
    const numberedPattern = /^\d+\.\s+(.+)$/gm;
    const numberedMatches = Array.from(topic.matchAll(numberedPattern));
    if (numberedMatches.length > 0) {
      return numberedMatches.map(m => m[1].trim()).slice(0, 5);
    }

    // Try bulleted lists
    const bulletPattern = /^[•\-*]\s+(.+)$/gm;
    const bulletMatches = Array.from(topic.matchAll(bulletPattern));
    if (bulletMatches.length > 0) {
      return bulletMatches.map(m => m[1].trim()).slice(0, 5);
    }

    // Split by sentences
    const sentences = topic.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  /**
   * Extract retrieval terms from text (simple keyword extraction).
   */
  private extractTerms(text: string): string[] {
    const stopwords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'shall', 'must', 'of', 'in', 'to',
      'for', 'with', 'on', 'at', 'from', 'by', 'as', 'into', 'through',
      'during', 'before', 'after', 'above', 'below', 'between', 'and', 'but',
      'or', 'not', 'no', 'nor', 'this', 'that', 'these', 'those', 'it',
      'its', 'how', 'what', 'which', 'who', 'whom', 'when', 'where', 'why',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s'-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));

    // Deduplicate
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * Validate that a facet has corpus evidence.
   */
  private async validateFacetEvidence(terms: string[]): Promise<boolean> {
    const query = terms.join(' ');
    try {
      const chunks = await this.retrieval.retrieveContext(query, {
        maxChunks: 3,
        minRelevance: 0.5,
      });
      return chunks.length >= this.config.minRetrievalHits;
    } catch {
      // Retrieval failure → treat as no evidence (demote to optional)
      return false;
    }
  }

  /**
   * Create a Facet from a ProposedFacet.
   */
  private createFacet(proposed: ProposedFacet): Facet {
    const facetId = randomUUID();
    const defaultEvidencePolicy = new Map<AtomKind, EvidenceRequirement>();

    // Set default evidence policy per kind based on facet role + strictness
    const strictness = this.config.defaultStrictness;
    const kinds: AtomKind[] = [
      'corpus_claim',
      'interpretive_move',
      'authorial_stipulation',
      'method',
      'organization',
    ];
    for (const kind of kinds) {
      defaultEvidencePolicy.set(kind, defaultEvidenceRequirement(kind, strictness));
    }

    return {
      facet_id: facetId,
      name: proposed.name,
      description: proposed.description,
      facet_role: proposed.role,
      evidence_policy_for_kind: defaultEvidencePolicy,
      archived: false,
      atoms_mode: this.config.defaultAtomsMode,
      reverse_check_mode: proposed.role === 'exploratory'
        ? 'off'
        : this.config.defaultReverseCheckMode,
    };
  }
}
