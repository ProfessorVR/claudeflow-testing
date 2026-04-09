/**
 * LLM Decomposition Provider — Concrete implementation of LLMDecompositionProvider
 *
 * Thin wrapper around ModelRouter that sends structured decomposition prompts
 * and validates the returned facet proposals.
 *
 * Features:
 *   - Multi-facet decomposition of research questions (2-5 facets)
 *   - Feedback loop: accepts previousFacets + feedback for iterative refinement
 *   - Schema validation of LLM output
 *   - Uses costTier: 'high' (Anthropic-first) — academic reasoning task
 *
 * @module llm-decomposition-provider
 */

import type {
  LLMDecompositionProvider,
  LLMDecompositionResult,
  ProposedFacet,
} from './prompt-decomposer.js';
import type { ModelRouter } from './model-router.js';

// =============================================================================
// DECOMPOSITION PROMPT
// =============================================================================

const DECOMPOSITION_SYSTEM_PROMPT = `You are an expert research methodologist specializing in decomposing complex research questions into thematic facets for evidence-first academic writing.

Your task is to break a research question into 2-5 focused thematic facets. Each facet represents a distinct dimension of the research question that can be independently investigated through corpus retrieval.

For each facet provide:
- name: Short title (max 60 characters)
- description: A detailed 50-100 word natural language description of the thematic dimension, phrased as a searchable research question. This description is used DIRECTLY as the semantic search query against the corpus, so it must contain the specific concepts, authors, texts, and terminology that would appear in relevant scholarly passages. Write it as a complete, self-contained research statement — not a brief label.
- role: "core" (essential to the argument), "supporting" (provides context), or "exploratory" (optional enrichment)
- retrieval_terms: 3-8 precise search terms for corpus retrieval. Use domain-specific vocabulary, technical translations (e.g., Greek/German equivalents), and key concepts derived STRICTLY from the core ideas in the user's prompt. You MUST NOT introduce external scholars, secondary commentators, or specific works from your training data (e.g., Modrak, Nussbaum, Kisiel, Volpi, Caston, Frede) unless they are explicitly named by the user.
- success_criteria: What evidence would satisfy this facet (1 sentence)

Additionally, based on the concepts detected in the prompt, suggest which corpus works should be prioritized. The AVAILABLE CORPUS WORKS list below is pre-categorized into PRIMARY TEXTS (the authors' own works) and SECONDARY SCHOLARSHIP (commentary). ONLY suggest works from this list — do not suggest works from your training data. Suggest primary texts that directly address the prompt's concepts, and secondary scholarship that provides interpretive context.

Respond ONLY with valid JSON matching this schema:
{
  "research_questions": ["string"],
  "facets": [
    {
      "name": "string",
      "description": "string",
      "role": "core" | "supporting" | "exploratory",
      "retrieval_terms": ["string"],
      "success_criteria": "string"
    }
  ],
  "retrieval_lexicon": { "facet_name": ["term1", "term2"] },
  "suggestedPrimarySources": [
    {
      "author": "string",
      "title": "string",
      "reason": "string (why this primary text is relevant)"
    }
  ],
  "suggestedSecondarySources": [
    {
      "author": "string",
      "title": "string",
      "reason": "string (why this commentary is relevant)"
    }
  ]
}`;

const REFINEMENT_PREAMBLE = `The user has reviewed the previous decomposition and provided feedback. Refine the facets based on their guidance while maintaining 2-5 focused thematic facets.

Previous decomposition:`;

// =============================================================================
// PROVIDER IMPLEMENTATION
// =============================================================================

export interface DecompositionOptions {
  /** Previously generated facets for iterative refinement */
  previousFacets?: ProposedFacet[];
  /** User feedback on previous decomposition */
  feedback?: string;
}

export class LLMDecompositionProviderImpl implements LLMDecompositionProvider {
  private readonly router: ModelRouter;

  constructor(router: ModelRouter) {
    this.router = router;
  }

  /**
   * Decompose a research prompt into thematic facets.
   * Supports iterative refinement via previousFacets + feedback.
   */
  async decompose(
    prompt: string,
    options?: DecompositionOptions,
  ): Promise<LLMDecompositionResult> {
    // Build tiered corpus catalog for source suggestion grounding (H-08)
    let corpusCatalog = '';
    try {
      const { buildCorpusCatalog } = await import('../../shared/cross-author-utils.js');
      const catalog = buildCorpusCatalog();
      if (catalog) {
        corpusCatalog = '\n\n' + catalog;
      }
    } catch { /* non-fatal */ }

    const basePrompt = options?.previousFacets
      ? this.buildRefinementPrompt(prompt, options.previousFacets, options.feedback)
      : prompt;

    const userPrompt = basePrompt + corpusCatalog;

    const result = await this.router.callJSON<LLMDecompositionResult>(
      {
        systemPrompt: DECOMPOSITION_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        costTier: 'high', // Academic reasoning — use Anthropic Claude
        temperature: 0.3,
        maxTokens: 4000,
      },
      validateDecompositionResult,
    );

    return result;
  }

  /**
   * Build a refinement prompt that includes previous facets and user feedback.
   */
  private buildRefinementPrompt(
    originalPrompt: string,
    previousFacets: ProposedFacet[],
    feedback?: string,
  ): string {
    const parts: string[] = [
      `Research question: ${originalPrompt}`,
      '',
      REFINEMENT_PREAMBLE,
      JSON.stringify(previousFacets, null, 2),
    ];

    if (feedback) {
      parts.push('', `User feedback: ${feedback}`);
    }

    parts.push('', 'Generate a refined decomposition based on this feedback.');

    return parts.join('\n');
  }
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate and normalize raw LLM output into LLMDecompositionResult.
 * Throws on invalid structure.
 */
function validateDecompositionResult(raw: unknown): LLMDecompositionResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Decomposition result must be an object');
  }

  const obj = raw as Record<string, unknown>;

  // Validate research_questions
  const researchQuestions = Array.isArray(obj.research_questions)
    ? obj.research_questions.filter((q): q is string => typeof q === 'string')
    : [];

  // Validate facets
  if (!Array.isArray(obj.facets) || obj.facets.length === 0) {
    throw new Error('Decomposition must produce at least 1 facet');
  }

  const facets: ProposedFacet[] = obj.facets
    .filter((f): f is Record<string, unknown> => f != null && typeof f === 'object')
    .map((f) => validateProposedFacet(f));

  if (facets.length === 0) {
    throw new Error('No valid facets in decomposition result');
  }

  // Validate retrieval_lexicon
  const lexicon: Record<string, string[]> = {};
  if (obj.retrieval_lexicon && typeof obj.retrieval_lexicon === 'object') {
    for (const [key, value] of Object.entries(obj.retrieval_lexicon as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        lexicon[key] = value.filter((v): v is string => typeof v === 'string');
      }
    }
  }

  // Build lexicon from facets if not provided
  if (Object.keys(lexicon).length === 0) {
    for (const facet of facets) {
      lexicon[facet.name] = facet.retrieval_terms;
    }
  }

  // Validate suggestedPrimarySources (optional)
  const suggestedPrimarySources: Array<{ author: string; title: string; reason: string }> = [];
  if (Array.isArray(obj.suggestedPrimarySources)) {
    for (const src of obj.suggestedPrimarySources) {
      if (src && typeof src === 'object' && typeof (src as any).author === 'string' && typeof (src as any).title === 'string') {
        suggestedPrimarySources.push({
          author: (src as any).author,
          title: (src as any).title,
          reason: typeof (src as any).reason === 'string' ? (src as any).reason : '',
        });
      }
    }
  }

  // Validate suggestedSecondarySources (optional)
  const suggestedSecondarySources: Array<{ author: string; title: string; reason: string }> = [];
  if (Array.isArray(obj.suggestedSecondarySources)) {
    for (const src of obj.suggestedSecondarySources) {
      if (src && typeof src === 'object' && typeof (src as any).author === 'string' && typeof (src as any).title === 'string') {
        suggestedSecondarySources.push({
          author: (src as any).author,
          title: (src as any).title,
          reason: typeof (src as any).reason === 'string' ? (src as any).reason : '',
        });
      }
    }
  }

  return {
    research_questions: researchQuestions.length > 0 ? researchQuestions : [facets[0].name],
    facets,
    retrieval_lexicon: lexicon,
    suggestedPrimarySources: suggestedPrimarySources.length > 0 ? suggestedPrimarySources : undefined,
    suggestedSecondarySources: suggestedSecondarySources.length > 0 ? suggestedSecondarySources : undefined,
  };
}

/**
 * Validate a single ProposedFacet from LLM output.
 */
function validateProposedFacet(raw: Record<string, unknown>): ProposedFacet {
  const name = typeof raw.name === 'string' ? raw.name.slice(0, 60) : 'Unnamed facet';
  const description = typeof raw.description === 'string' ? raw.description : name;

  const roleRaw = typeof raw.role === 'string' ? raw.role.toLowerCase() : 'supporting';
  const role = (['core', 'supporting', 'exploratory'].includes(roleRaw) ? roleRaw : 'supporting') as ProposedFacet['role'];

  const retrievalTerms = Array.isArray(raw.retrieval_terms)
    ? raw.retrieval_terms
        .filter((t): t is string => typeof t === 'string' && t.length > 0)
        .slice(0, 10)
    : [];

  const successCriteria = typeof raw.success_criteria === 'string'
    ? raw.success_criteria
    : `Address: ${name}`;

  return { name, description, role, retrieval_terms: retrievalTerms, success_criteria: successCriteria };
}
