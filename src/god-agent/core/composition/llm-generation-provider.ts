/**
 * LLM Generation Provider — Concrete implementation of GenerationProvider
 *
 * Thin wrapper around ModelRouter for the three GenerationProvider methods:
 *   1. generateParagraph — prose generation (costTier: 'high')
 *   2. generateParagraphPlan — atom organization into paragraphs (costTier: 'high')
 *   3. generateSentenceMapping — post-hoc atom-sentence mapping (costTier: 'high')
 *
 * All structured output methods use ModelRouter.callJSON() for robust JSON
 * parsing and validation.
 *
 * @module llm-generation-provider
 */

import { randomUUID } from 'crypto';
import type { GenerationProvider } from './constrained-generator.js';
import type { ClaimAtom, ClaimBinding, ParagraphPlanEntry } from './icp-types.js';
import type { ModelRouter } from './model-router.js';

// =============================================================================
// SYSTEM PROMPTS
// =============================================================================

const PLAN_SYSTEM_PROMPT = `You are organizing claim atoms into a paragraph plan for academic writing.

Given a list of claim atoms (each with an ID, display text, modality, and kind) and their evidence bindings, organize them into paragraphs.

Rules:
- Group related atoms that form a coherent argumentative thread
- Order paragraphs logically (definitions first, then analysis, then implications)
- Each paragraph should have 2-5 atoms
- Include required quote IDs from bindings in each paragraph's required_quotes

Respond ONLY with valid JSON array:
[
  {
    "paragraph_id": "uuid",
    "paragraph_order": 0,
    "atom_ids": ["atom_id_1", "atom_id_2"],
    "required_quotes": ["quote_id_1"]
  }
]`;

const MAPPING_SYSTEM_PROMPT = `You are mapping sentences to claim atoms for academic writing analysis.

Given a paragraph of text and a list of atom IDs, identify which atoms each sentence supports.

Rules:
- Each sentence may support 0 or more atoms
- Only map atoms that the sentence directly supports or provides evidence for
- Sentences that are transitions or rhetorical glue may support 0 atoms
- Be precise: only include atom IDs that the sentence genuinely addresses

Respond ONLY with valid JSON array:
[
  {
    "sentence_id": "uuid",
    "text": "The sentence text.",
    "supports_atoms": ["atom_id_1"]
  }
]`;

// =============================================================================
// PROVIDER IMPLEMENTATION
// =============================================================================

export class LLMGenerationProviderImpl implements GenerationProvider {
  private readonly router: ModelRouter;

  constructor(router: ModelRouter) {
    this.router = router;
  }

  /**
   * Generate a single academic paragraph from the given prompt and system constraints.
   * Uses costTier: 'high' because prose quality matters.
   */
  async generateParagraph(prompt: string, systemPrompt: string): Promise<string> {
    const response = await this.router.call({
      systemPrompt,
      userPrompt: prompt,
      maxTokens: 2000,
      temperature: 0.7,
      costTier: 'high',
    });
    return response.content;
  }

  /**
   * Generate a paragraph plan organizing atoms into coherent paragraphs.
   * Uses costTier: 'high' — academic structuring task, use Anthropic Claude.
   */
  async generateParagraphPlan(
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
  ): Promise<ParagraphPlanEntry[]> {
    const userPrompt = buildPlanPrompt(atoms, bindings);

    return this.router.callJSON<ParagraphPlanEntry[]>(
      {
        systemPrompt: PLAN_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        costTier: 'high',
        temperature: 0.3,
        maxTokens: 2000,
      },
      validateParagraphPlan,
    );
  }

  /**
   * Generate sentence-to-atom mapping for analytics mode.
   * Uses costTier: 'high' — academic analysis task, use Anthropic Claude.
   */
  async generateSentenceMapping(
    paragraphText: string,
    atomIds: string[],
  ): Promise<Array<{ sentence_id: string; text: string; supports_atoms: string[] }>> {
    const userPrompt = buildMappingPrompt(paragraphText, atomIds);

    return this.router.callJSON<Array<{ sentence_id: string; text: string; supports_atoms: string[] }>>(
      {
        systemPrompt: MAPPING_SYSTEM_PROMPT,
        userPrompt,
        jsonMode: true,
        costTier: 'high',
        temperature: 0.3,
        maxTokens: 4000,
      },
      validateSentenceMapping,
    );
  }
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

function buildPlanPrompt(atoms: ClaimAtom[], bindings: ClaimBinding[]): string {
  const parts: string[] = ['ATOMS:'];

  for (const atom of atoms) {
    const atomBindings = bindings.filter(b => b.atom_ids.includes(atom.atom_id));
    const quoteIds = atomBindings.flatMap(b => b.quote_ids);
    parts.push(
      `- [${atom.atom_id}] "${atom.display_text}" (${atom.modality}, ${atom.kind})` +
      (quoteIds.length > 0 ? ` — quotes: ${quoteIds.join(', ')}` : ''),
    );
  }

  parts.push('', `Total atoms: ${atoms.length}`, `Total bindings: ${bindings.length}`);
  parts.push('', 'Organize these atoms into a paragraph plan.');

  return parts.join('\n');
}

function buildMappingPrompt(paragraphText: string, atomIds: string[]): string {
  return [
    'PARAGRAPH:',
    paragraphText,
    '',
    'ATOM IDS:',
    atomIds.join(', '),
    '',
    'Map each sentence to the atoms it supports.',
  ].join('\n');
}

// =============================================================================
// VALIDATORS
// =============================================================================

function validateParagraphPlan(raw: unknown): ParagraphPlanEntry[] {
  if (!Array.isArray(raw)) {
    throw new Error('Paragraph plan must be an array');
  }

  return raw.map((entry: unknown, i: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Plan entry ${i} must be an object`);
    }

    const e = entry as Record<string, unknown>;

    return {
      paragraph_id: typeof e.paragraph_id === 'string' ? e.paragraph_id : randomUUID(),
      paragraph_order: typeof e.paragraph_order === 'number' ? e.paragraph_order : i,
      atom_ids: Array.isArray(e.atom_ids)
        ? e.atom_ids.filter((id): id is string => typeof id === 'string')
        : [],
      required_quotes: Array.isArray(e.required_quotes)
        ? e.required_quotes.filter((id): id is string => typeof id === 'string')
        : [],
    };
  });
}

function validateSentenceMapping(
  raw: unknown,
): Array<{ sentence_id: string; text: string; supports_atoms: string[] }> {
  if (!Array.isArray(raw)) {
    throw new Error('Sentence mapping must be an array');
  }

  return raw.map((entry: unknown, i: number) => {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`Mapping entry ${i} must be an object`);
    }

    const e = entry as Record<string, unknown>;

    return {
      sentence_id: typeof e.sentence_id === 'string' ? e.sentence_id : randomUUID(),
      text: typeof e.text === 'string' ? e.text : '',
      supports_atoms: Array.isArray(e.supports_atoms)
        ? e.supports_atoms.filter((id): id is string => typeof id === 'string')
        : [],
    };
  });
}
