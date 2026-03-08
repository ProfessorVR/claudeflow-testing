/**
 * Pipeline utility functions — pure helpers shared across stages.
 *
 * Functions:
 * - deduplicateChunks: Remove duplicate chunks by ID
 * - estimateTokenBudget: Estimate prompt token usage and suggest trimming
 */

import type { ContextChunk } from '../../retrieval/types.js';

/**
 * Deduplicate chunks by a composite ID derived from metadata.
 */
export function deduplicateChunks(chunks: ContextChunk[]): ContextChunk[] {
  const seen = new Set<string>();
  const result: ContextChunk[] = [];
  for (const c of chunks) {
    const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
    if (!seen.has(id)) {
      seen.add(id);
      result.push(c);
    }
  }
  return result;
}

/**
 * Estimate the token budget for a generation prompt.
 *
 * Uses chars/4 heuristic for token estimation.
 * Returns whether the prompt is over budget and suggests max output tokens.
 */
export function estimateTokenBudget(
  chunks: ContextChunk[],
  stylePrompt: string,
  constraints: string,
  options: {
    contextWindowTokens?: number;
    reservedOutputTokens?: number;
  } = {}
): {
  inputTokens: number;
  suggestedMaxOutput: number;
  overBudget: boolean;
  totalChars: number;
} {
  const contextWindow = options.contextWindowTokens ?? 200000; // Claude default
  const reservedOutput = options.reservedOutputTokens ?? 16384;

  const chunkChars = chunks.reduce((sum, c) => sum + (c.content?.length || 0), 0);
  const totalChars = chunkChars + stylePrompt.length + constraints.length;
  const inputTokens = Math.ceil(totalChars / 4);

  const availableForOutput = contextWindow - inputTokens;
  const suggestedMaxOutput = Math.min(reservedOutput, Math.max(4096, availableForOutput));
  const overBudget = inputTokens + reservedOutput > contextWindow;

  return { inputTokens, suggestedMaxOutput, overBudget, totalChars };
}
