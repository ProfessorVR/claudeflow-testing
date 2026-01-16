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

  constructor(options?: {
    pythonPath?: string;
    projectRoot?: string;
  }) {
    this.pythonPath = options?.pythonPath ?? 'python3';
    this.projectRoot = options?.projectRoot ?? process.cwd();
    this.scriptPath = join(this.projectRoot, 'scripts', 'explore', 'cli', 'god_explore.py');
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
          // Find JSON in output (may have other text before it)
          const jsonMatch = stdout.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (!jsonMatch) {
            reject(new ExploreError(
              'No JSON found in output',
              args,
              undefined,
              stdout
            ));
            return;
          }
          const result = JSON.parse(jsonMatch[1]) as T;
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
   */
  async listKUs(options?: KUQueryOptions): Promise<KnowledgeUnit[]> {
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

    return this.execute<KnowledgeUnit[]>(args);
  }

  /**
   * List reasoning units with optional filters
   */
  async listRUs(options?: RUQueryOptions): Promise<ReasoningUnit[]> {
    const args = ['list', 'rus'];

    if (options?.relation) {
      args.push('--relation', options.relation);
    }
    if (options?.minScore !== undefined) {
      args.push('--min-score', options.minScore.toString());
    }
    if (options?.sourceKuId) {
      args.push('--source', options.sourceKuId);
    }
    if (options?.targetKuId) {
      args.push('--target', options.targetKuId);
    }
    if (options?.limit !== undefined) {
      args.push('--limit', options.limit.toString());
    }

    return this.execute<ReasoningUnit[]>(args);
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
