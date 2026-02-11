/**
 * DESCEpisodeManager - DESC episodic memory injection and storage
 *
 * Extracted from UniversalAgent (Tranche E-02, SEAM-5).
 * Manages interaction with UCM daemon for episodic memory.
 */

import type { UCMDaemonClient } from '../cli/ucm-daemon-client.js';

export interface DESCConfig {
  enableDESC: boolean;
  descThreshold: number;
  descMaxEpisodes: number;
  autoStoreThreshold: number;
}

export interface DESCInjectResult {
  augmentedPrompt: string;
  episodesUsed: number;
  episodeIds: string[];
}

export type AgentModeHint = string;

export class DESCEpisodeManager {
  constructor(
    private config: DESCConfig,
    private ucmClient: UCMDaemonClient | null,
    private log: (message: string) => void
  ) {}

  /**
   * Inject prior solutions from DESC episodic memory (RULE-010)
   * Uses default window size of 3 episodes for general agent work
   */
  async injectEpisodes(
    prompt: string,
    context?: { command?: string; mode?: AgentModeHint }
  ): Promise<DESCInjectResult> {
    if (!this.config.enableDESC || !this.ucmClient) {
      return { augmentedPrompt: prompt, episodesUsed: 0, episodeIds: [] };
    }

    try {
      const result = await this.ucmClient.injectSolutions(prompt, {
        threshold: this.config.descThreshold,
        maxEpisodes: this.config.descMaxEpisodes,
        agentType: context?.mode ?? 'general',
        metadata: {
          source: 'universal-agent',
          command: context?.command ?? 'unknown',
          timestamp: Date.now(),
        },
      });

      if (result.episodesUsed > 0) {
        this.log(`DESC: Injected ${result.episodesUsed} prior solutions for ${context?.command ?? 'task'}`);
      }

      return result;
    } catch (error) {
      this.log(`DESC: Episode injection failed, using original prompt: ${error}`);
      return { augmentedPrompt: prompt, episodesUsed: 0, episodeIds: [] };
    }
  }

  /**
   * Store a completed episode for future DESC retrieval
   */
  async storeEpisode(
    queryText: string,
    answerText: string,
    context?: { command?: string; mode?: AgentModeHint; quality?: number }
  ): Promise<void> {
    if (!this.config.enableDESC || !this.ucmClient) {
      return;
    }

    const quality = context?.quality ?? 0.7;
    if (quality < this.config.autoStoreThreshold) {
      this.log(`DESC: Skipping episode storage (quality ${quality.toFixed(2)} < threshold ${this.config.autoStoreThreshold})`);
      return;
    }

    try {
      const result = await this.ucmClient.storeEpisode(queryText, answerText, {
        source: 'universal-agent',
        command: context?.command ?? 'unknown',
        mode: context?.mode ?? 'general',
        quality,
        timestamp: Date.now(),
      });

      if (result.success) {
        this.log(`DESC: Stored episode ${result.episodeId} for future learning`);
      }
    } catch (error) {
      this.log(`DESC: Episode storage failed: ${error}`);
    }
  }
}
