/**
 * Checkpoint and Resume System for Long-Running PDF Analyses
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { AnalysisCheckpoint, ChunkAnalysis } from './pdf-analysis-types.js';

export class CheckpointManager {
  private checkpointDir: string;

  constructor(checkpointDir: string = './.pdf-analysis-checkpoints') {
    this.checkpointDir = checkpointDir;
  }

  /**
   * Save checkpoint
   */
  async save(checkpoint: AnalysisCheckpoint): Promise<string> {
    await fs.mkdir(this.checkpointDir, { recursive: true });

    const filename = `${checkpoint.sessionId}.json`;
    const filepath = join(this.checkpointDir, filename);

    await fs.writeFile(filepath, JSON.stringify(checkpoint, null, 2));

    return filepath;
  }

  /**
   * Load checkpoint by session ID
   */
  async load(sessionId: string): Promise<AnalysisCheckpoint | null> {
    try {
      const filepath = join(this.checkpointDir, `${sessionId}.json`);
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * List all checkpoints
   */
  async list(): Promise<AnalysisCheckpoint[]> {
    try {
      await fs.mkdir(this.checkpointDir, { recursive: true });
      const files = await fs.readdir(this.checkpointDir);

      const checkpoints: AnalysisCheckpoint[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(join(this.checkpointDir, file), 'utf-8');
          checkpoints.push(JSON.parse(data));
        }
      }

      return checkpoints.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      return [];
    }
  }

  /**
   * Delete checkpoint
   */
  async delete(sessionId: string): Promise<boolean> {
    try {
      const filepath = join(this.checkpointDir, `${sessionId}.json`);
      await fs.unlink(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean old checkpoints (older than N days)
   */
  async cleanup(daysOld: number = 7): Promise<number> {
    const checkpoints = await this.list();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    let deletedCount = 0;

    for (const checkpoint of checkpoints) {
      const checkpointDate = new Date(checkpoint.timestamp);
      if (checkpointDate < cutoffDate) {
        const deleted = await this.delete(checkpoint.sessionId);
        if (deleted) deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get checkpoint by PDF path (most recent)
   */
  async findByPDF(pdfPath: string): Promise<AnalysisCheckpoint | null> {
    const checkpoints = await this.list();
    const matching = checkpoints.filter((cp) => cp.pdfPath === pdfPath);

    return matching.length > 0 ? matching[0] : null;
  }

  /**
   * Create incremental checkpoint
   */
  static createIncrementalCheckpoint(
    previous: AnalysisCheckpoint | null,
    update: {
      currentChunk: number;
      newAnalysis?: ChunkAnalysis;
    }
  ): AnalysisCheckpoint {
    const completedAnalyses = previous ? [...previous.completedAnalyses] : [];

    if (update.newAnalysis) {
      completedAnalyses.push(update.newAnalysis);
    }

    return {
      sessionId: previous?.sessionId || `session-${Date.now()}`,
      pdfPath: previous?.pdfPath || '',
      objective: previous?.objective || '',
      mode: previous?.mode || 'hybrid',
      currentChunk: update.currentChunk,
      totalChunks: previous?.totalChunks || 0,
      completedAnalyses,
      timestamp: new Date().toISOString(),
      canResume: true,
    };
  }

  /**
   * Get checkpoint summary statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byMode: Record<string, number>;
    resumable: number;
    avgProgress: number;
  }> {
    const checkpoints = await this.list();

    const stats = {
      total: checkpoints.length,
      byMode: {} as Record<string, number>,
      resumable: 0,
      avgProgress: 0,
    };

    let totalProgress = 0;

    for (const cp of checkpoints) {
      // Count by mode
      stats.byMode[cp.mode] = (stats.byMode[cp.mode] || 0) + 1;

      // Count resumable
      if (cp.canResume) stats.resumable++;

      // Calculate progress
      const progress = cp.totalChunks > 0 ? (cp.currentChunk / cp.totalChunks) * 100 : 0;
      totalProgress += progress;
    }

    stats.avgProgress = checkpoints.length > 0 ? totalProgress / checkpoints.length : 0;

    return stats;
  }

  /**
   * Export checkpoint to portable format
   */
  async export(sessionId: string, outputPath: string): Promise<boolean> {
    const checkpoint = await this.load(sessionId);
    if (!checkpoint) return false;

    await fs.writeFile(outputPath, JSON.stringify(checkpoint, null, 2));
    return true;
  }

  /**
   * Import checkpoint from file
   */
  async import(filepath: string): Promise<string | null> {
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      const checkpoint: AnalysisCheckpoint = JSON.parse(data);

      // Generate new session ID to avoid conflicts
      checkpoint.sessionId = `imported-${Date.now()}`;
      checkpoint.timestamp = new Date().toISOString();

      await this.save(checkpoint);
      return checkpoint.sessionId;
    } catch {
      return null;
    }
  }
}

/**
 * Auto-save decorator for checkpoint-enabled operations
 */
export function AutoCheckpoint(checkpointManager: CheckpointManager) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Auto-save checkpoint after operation
      if (result && typeof result === 'object' && 'sessionId' in result) {
        await checkpointManager.save(result);
      }

      return result;
    };

    return descriptor;
  };
}
