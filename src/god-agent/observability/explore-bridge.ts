/**
 * Python-Node Bridge for Explore System
 *
 * Provides TypeScript wrappers around the Python explore CLI
 * for integration with the web dashboard.
 *
 * Uses child_process.spawn() to call the Python CLI and parse JSON output.
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Strip ANSI color codes from string
 */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, '');
}

/**
 * Extract JSON from mixed output (handles text before/after JSON)
 * More robust than simple regex - finds balanced brackets
 */
function extractJson(output: string): string | null {
  // First strip ANSI codes
  const cleaned = stripAnsi(output).trim();

  // Try to find JSON array
  const arrayStart = cleaned.indexOf('[');
  if (arrayStart !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = arrayStart; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\' && inString) {
        escape = true;
        continue;
      }

      if (char === '"' && !escape) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '[') depth++;
        if (char === ']') depth--;

        if (depth === 0) {
          return cleaned.substring(arrayStart, i + 1);
        }
      }
    }
  }

  // Try to find JSON object
  const objectStart = cleaned.indexOf('{');
  if (objectStart !== -1) {
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = objectStart; i < cleaned.length; i++) {
      const char = cleaned[i];

      if (escape) {
        escape = false;
        continue;
      }

      if (char === '\\' && inString) {
        escape = true;
        continue;
      }

      if (char === '"' && !escape) {
        inString = !inString;
        continue;
      }

      if (!inString) {
        if (char === '{') depth++;
        if (char === '}') depth--;

        if (depth === 0) {
          return cleaned.substring(objectStart, i + 1);
        }
      }
    }
  }

  return null;
}

// ===== TYPES =====

/**
 * Knowledge Unit from the explore system
 */
export interface KnowledgeUnit {
  id: string;
  query: string;
  content: string;
  confidence: number;
  source_count: number;
  sources: Array<{
    chunk_id: string;
    doc_path: string;
    relevance: number;
  }>;
  created_at?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Reasoning Unit representing relationships between KUs
 */
export interface ReasoningUnit {
  id: string;
  source_ku_id: string;
  target_ku_id: string;
  relation: 'supports' | 'conflicts' | 'elaborates' | 'prerequisite' | 'similar';
  score: number;
  evidence?: string;
  created_at?: string;
}

/**
 * Provenance trace for a knowledge unit
 */
export interface ProvenanceTrace {
  ku_id: string;
  chain: Array<{
    level: 'answer' | 'reasoning' | 'ku' | 'chunk' | 'document';
    id: string;
    content?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * D3.js graph format for visualization
 */
export interface D3Graph {
  nodes: Array<{
    id: string;
    label: string;
    type: 'ku' | 'ru' | 'document' | 'query';
    confidence?: number;
    metadata?: Record<string, unknown>;
  }>;
  links: Array<{
    source: string;
    target: string;
    relation?: string;
    weight?: number;
  }>;
}

/**
 * Coverage analysis result
 */
export interface CoverageAnalysis {
  total_queries: number;
  covered_queries: number;
  coverage_percentage: number;
  total_documents: number;
  used_documents: number;
  gaps: Array<{
    query: string;
    missing_coverage: string[];
  }>;
  heatmap?: Array<{
    query: string;
    document: string;
    coverage: number;
  }>;
}

/**
 * Explore system statistics
 */
export interface ExploreStats {
  total_kus: number;
  total_rus: number;
  total_chunks: number;
  total_documents: number;
  avg_confidence: number;
  relation_distribution: Record<string, number>;
  query_count: number;
}

/**
 * Query options for listing KUs
 */
export interface KUQueryOptions {
  query?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

/**
 * Query options for listing RUs
 */
export interface RUQueryOptions {
  relation?: string;
  minScore?: number;
  sourceKuId?: string;
  targetKuId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Options for building graphs
 */
export interface GraphOptions {
  format?: 'd3' | 'dot' | 'cytoscape' | 'mermaid';
  type?: 'ku' | 'full' | 'provenance';
  kuId?: string;
  maxNodes?: number;
}

// ===== BRIDGE CLASS =====

/**
 * Bridge to Python explore CLI
 */
export class ExploreBridge {
  private readonly pythonPath: string;
  private readonly scriptPath: string;
  private readonly projectRoot: string;
  private readonly knowledgePath: string;
  private readonly reasoningPath: string;

  constructor(options?: {
    pythonPath?: string;
    projectRoot?: string;
  }) {
    this.pythonPath = options?.pythonPath ?? 'python3';
    this.projectRoot = options?.projectRoot ?? process.cwd();
    this.scriptPath = join(this.projectRoot, 'scripts', 'explore', 'cli', 'god_explore.py');
    this.knowledgePath = join(this.projectRoot, 'god-learn', 'knowledge.jsonl');
    this.reasoningPath = join(this.projectRoot, 'god-reason', 'reasoning.jsonl');
  }

  /**
   * Check if the learning corpus exists
   */
  hasLearningCorpus(): boolean {
    return existsSync(this.knowledgePath);
  }

  /**
   * Check if reasoning data exists
   */
  hasReasoningData(): boolean {
    return existsSync(this.reasoningPath);
  }

  /**
   * Execute a Python CLI command and return JSON result
   */
  private async execute<T>(args: string[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const fullArgs = ['-m', 'scripts.explore.cli.god_explore', ...args, '--json'];

      const proc = spawn(this.pythonPath, fullArgs, {
        cwd: this.projectRoot,
        env: {
          ...process.env,
          PYTHONPATH: this.projectRoot,
          // Disable ANSI colors in Python output
          NO_COLOR: '1',
          TERM: 'dumb',
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new ExploreError(
            `Explore command failed with code ${code}: ${stderr}`,
            args,
            code ?? undefined
          ));
          return;
        }

        try {
          // Use improved JSON extraction that handles ANSI codes and mixed output
          const jsonStr = extractJson(stdout);
          if (!jsonStr) {
            reject(new ExploreError(
              'No JSON found in output',
              args,
              undefined,
              stdout
            ));
            return;
          }
          const result = JSON.parse(jsonStr) as T;
          resolve(result);
        } catch (err) {
          reject(new ExploreError(
            `Failed to parse JSON output: ${err}`,
            args,
            undefined,
            stdout
          ));
        }
      });

      proc.on('error', (err) => {
        reject(new ExploreError(
          `Failed to spawn Python process: ${err.message}`,
          args
        ));
      });
    });
  }

  /**
   * List knowledge units with optional filters
   * Returns empty array if learning corpus doesn't exist
   */
  async listKUs(options?: KUQueryOptions): Promise<KnowledgeUnit[]> {
    // Return empty array if corpus doesn't exist
    if (!this.hasLearningCorpus()) {
      return [];
    }

    const args = ['list', 'kus'];

    if (options?.query) {
      args.push('--query', options.query);
    }
    if (options?.minConfidence !== undefined) {
      args.push('--confidence', options.minConfidence.toString());
    }
    if (options?.limit !== undefined) {
      args.push('--limit', options.limit.toString());
    }
    if (options?.offset !== undefined) {
      args.push('--offset', options.offset.toString());
    }

    try {
      return await this.execute<KnowledgeUnit[]>(args);
    } catch (err) {
      // If Python CLI fails, return empty array instead of throwing
      if (err instanceof ExploreError) {
        // Log but don't throw - graceful degradation
        console.warn(`ExploreBridge.listKUs failed: ${err.message}`);
        return [];
      }
      throw err;
    }
  }

  /**
   * List reasoning units with optional filters
   * Returns empty array if reasoning data doesn't exist
   * Note: The Python CLI doesn't support --json for RUs, so we return empty for now
   */
  async listRUs(options?: RUQueryOptions): Promise<ReasoningUnit[]> {
    // Return empty array if reasoning data doesn't exist
    if (!this.hasReasoningData()) {
      return [];
    }

    // NOTE: The Python CLI doesn't support --json flag for 'list rus'
    // Until the Python CLI is updated, return empty array with a warning
    console.warn('ExploreBridge.listRUs: Python CLI does not support --json for RUs, returning empty array');
    return [];

    // Original implementation (uncomment when Python CLI supports --json for RUs):
    // const args = ['list', 'rus'];
    //
    // if (options?.relation) {
    //   args.push('--relation', options.relation);
    // }
    // if (options?.minScore !== undefined) {
    //   args.push('--min-score', options.minScore.toString());
    // }
    // if (options?.sourceKuId) {
    //   args.push('--source', options.sourceKuId);
    // }
    // if (options?.targetKuId) {
    //   args.push('--target', options.targetKuId);
    // }
    // if (options?.limit !== undefined) {
    //   args.push('--limit', options.limit.toString());
    // }
    //
    // try {
    //   return await this.execute<ReasoningUnit[]>(args);
    // } catch (err) {
    //   if (err instanceof ExploreError) {
    //     console.warn(`ExploreBridge.listRUs failed: ${err.message}`);
    //     return [];
    //   }
    //   throw err;
    // }
  }

  /**
   * Get a single knowledge unit by ID
   */
  async getKU(id: string): Promise<KnowledgeUnit> {
    return this.execute<KnowledgeUnit>(['show', 'ku', id]);
  }

  /**
   * Get a single reasoning unit by ID
   */
  async getRU(id: string): Promise<ReasoningUnit> {
    return this.execute<ReasoningUnit>(['show', 'ru', id]);
  }

  /**
   * Get provenance trace for a knowledge unit
   */
  async traceKU(id: string): Promise<ProvenanceTrace> {
    return this.execute<ProvenanceTrace>(['trace', 'ku', id]);
  }

  /**
   * Build knowledge graph in specified format
   */
  async buildGraph(options?: GraphOptions): Promise<D3Graph> {
    const args = ['graph'];

    const format = options?.format ?? 'd3';
    args.push('--format', format);

    if (options?.type) {
      args.push('--type', options.type);
    }
    if (options?.kuId) {
      args.push('--ku', options.kuId);
    }
    if (options?.maxNodes !== undefined) {
      args.push('--max-nodes', options.maxNodes.toString());
    }

    return this.execute<D3Graph>(args);
  }

  /**
   * Get coverage analysis
   */
  async getCoverage(options?: {
    showGaps?: boolean;
    includeHeatmap?: boolean;
  }): Promise<CoverageAnalysis> {
    const args = ['coverage'];

    if (options?.showGaps) {
      args.push('--show-gaps');
    }
    if (options?.includeHeatmap) {
      args.push('--heatmap');
    }

    return this.execute<CoverageAnalysis>(args);
  }

  /**
   * Get explore system statistics
   */
  async getStats(): Promise<ExploreStats> {
    return this.execute<ExploreStats>(['stats']);
  }

  /**
   * Check if the explore system is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.getStats();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search across KUs with semantic similarity
   */
  async searchKUs(query: string, limit?: number): Promise<Array<KnowledgeUnit & { score: number }>> {
    const args = ['search', query];
    if (limit !== undefined) {
      args.push('--limit', limit.toString());
    }
    return this.execute<Array<KnowledgeUnit & { score: number }>>(args);
  }
}

/**
 * Custom error for explore bridge operations
 */
export class ExploreError extends Error {
  constructor(
    message: string,
    public readonly command: string[],
    public readonly exitCode?: number,
    public readonly rawOutput?: string
  ) {
    super(message);
    this.name = 'ExploreError';
  }
}

// ===== SINGLETON =====

let bridgeInstance: ExploreBridge | null = null;

/**
 * Get or create the singleton ExploreBridge instance
 */
export function getExploreBridge(options?: {
  pythonPath?: string;
  projectRoot?: string;
}): ExploreBridge {
  if (!bridgeInstance) {
    bridgeInstance = new ExploreBridge(options);
  }
  return bridgeInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetExploreBridge(): void {
  bridgeInstance = null;
}

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Quick access to list KUs
 */
export async function listKUs(options?: KUQueryOptions): Promise<KnowledgeUnit[]> {
  return getExploreBridge().listKUs(options);
}

/**
 * Quick access to list RUs
 */
export async function listRUs(options?: RUQueryOptions): Promise<ReasoningUnit[]> {
  return getExploreBridge().listRUs(options);
}

/**
 * Quick access to get graph
 */
export async function getGraph(options?: GraphOptions): Promise<D3Graph> {
  return getExploreBridge().buildGraph(options);
}

/**
 * Quick access to get stats
 */
export async function getExploreStats(): Promise<ExploreStats> {
  return getExploreBridge().getStats();
}
