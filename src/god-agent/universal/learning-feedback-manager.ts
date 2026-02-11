/**
 * LearningFeedbackManager - Feedback processing, pattern reinforcement, and learning
 *
 * Extracted from UniversalAgent (Tranche E-06, SEAM-7).
 * Depends on KnowledgeManager (SEAM-2) for storeKnowledge().
 */

import type { TrajectoryBridge, FeedbackResult } from './trajectory-bridge.js';
import type { InteractionStore } from './interaction-store.js';
import type { Interaction, KnowledgeEntry } from './universal-agent.js';
import type { QueryResult } from '../core/god-agent.js';

export interface LearningFeedbackDeps {
  interactionStore: InteractionStore;
  trajectoryBridge: TrajectoryBridge | null;
  agent: {
    query: (embedding: Float32Array, opts: { k: number }) => Promise<QueryResult>;
    learn: (data: { queryId: string; patternId: string; verdict: 'positive' | 'negative' | 'neutral'; score?: number }) => Promise<void>;
  };
  successfulPatterns: Map<string, number>;
  autoStoreThreshold: number;
  embed: (text: string) => Promise<Float32Array>;
  storeKnowledge: (entry: Omit<KnowledgeEntry, 'id' | 'quality' | 'usageCount' | 'lastUsed' | 'createdAt'>) => Promise<string>;
  log: (message: string) => void;
}

export class LearningFeedbackManager {
  constructor(private deps: LearningFeedbackDeps) {}

  /**
   * Process feedback for an interaction or trajectory
   */
  async feedback(
    id: string,
    rating: number,
    options: {
      useful?: boolean;
      notes?: string;
      isTrajectoryId?: boolean;
    } = {}
  ): Promise<FeedbackResult> {
    let trajectoryId: string | undefined;
    let interaction: Interaction | undefined;

    if (options.isTrajectoryId) {
      trajectoryId = id;
    } else {
      interaction = this.deps.interactionStore.get(id);
      if (!interaction) {
        this.deps.log(`Warning: Interaction ${id} not found`);
        return { weightUpdates: 0, patternCreated: false };
      }
      trajectoryId = interaction.trajectoryId;
    }

    const feedbackData = {
      rating,
      useful: options.useful ?? rating > 0.5,
      notes: options.notes,
    };

    if (interaction) {
      this.deps.interactionStore.updateFeedback(id, feedbackData);
    }

    // Submit to SonaEngine via TrajectoryBridge (FR-11)
    let feedbackResult: FeedbackResult = { weightUpdates: 0, patternCreated: false };
    if (this.deps.trajectoryBridge && trajectoryId) {
      try {
        feedbackResult = await this.deps.trajectoryBridge.submitFeedback(
          trajectoryId,
          rating,
          { notes: options.notes }
        );
        this.deps.log(`SonaEngine feedback: trajectory=${trajectoryId}, rating=${rating.toFixed(2)}, patternCreated=${feedbackResult.patternCreated}`);
      } catch (error) {
        this.deps.log(`Warning: SonaEngine feedback failed: ${error}`);
      }
    }

    // Legacy learning from this feedback
    if (interaction) {
      if (rating > this.deps.autoStoreThreshold) {
        await this.reinforcePattern(interaction);
      } else if (rating < 0.3) {
        await this.weakenPattern(interaction);
      }
    }

    this.deps.log(`Feedback recorded: ${rating} for ${id}`);
    return feedbackResult;
  }

  /**
   * Learn from successful interaction (auto-store high quality patterns)
   */
  async learnFromInteraction(interaction: Interaction): Promise<void> {
    const implicitQuality = this.assessQuality(interaction);

    if (implicitQuality > this.deps.autoStoreThreshold) {
      await this.deps.storeKnowledge({
        content: `${interaction.input} -> ${interaction.output}`,
        type: 'pattern',
        domain: interaction.mode,
        tags: this.extractTags(interaction.input),
      });

      this.deps.log(`Auto-learned from interaction: ${interaction.id}`);
    }
  }

  /**
   * Reinforce a successful pattern
   */
  private async reinforcePattern(interaction: Interaction): Promise<void> {
    const embedding = interaction.embedding ?? await this.deps.embed(interaction.input);

    const results = await this.deps.agent.query(embedding, { k: 1 });

    if (results.patterns.length > 0) {
      await this.deps.agent.learn({
        queryId: results.queryId,
        patternId: results.patterns[0].id,
        verdict: 'positive',
        score: interaction.feedback?.rating ?? 0.9,
      });

      const key = results.patterns[0].id;
      this.deps.successfulPatterns.set(key, (this.deps.successfulPatterns.get(key) ?? 0) + 1);
    }
  }

  /**
   * Weaken an unsuccessful pattern
   */
  private async weakenPattern(interaction: Interaction): Promise<void> {
    const embedding = interaction.embedding ?? await this.deps.embed(interaction.input);

    const results = await this.deps.agent.query(embedding, { k: 1 });

    if (results.patterns.length > 0) {
      await this.deps.agent.learn({
        queryId: results.queryId,
        patternId: results.patterns[0].id,
        verdict: 'negative',
        score: interaction.feedback?.rating ?? 0.1,
      });
    }
  }

  /**
   * Heuristic quality assessment
   */
  private assessQuality(interaction: Interaction): number {
    let quality = 0.5;

    if (interaction.output.length > 500) quality += 0.1;
    if (interaction.output.length > 1000) quality += 0.1;
    if (interaction.output.includes('```')) quality += 0.1;
    if (interaction.output.includes('\n-')) quality += 0.05;

    return Math.min(quality, 1.0);
  }

  /**
   * Extract meaningful tags from text
   */
  extractTags(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'when', 'whenever', 'where', 'wherever', 'whether', 'which', 'while', 'who', 'whoever', 'whom', 'whose', 'why', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'this', 'that', 'these', 'those', 'am']);

    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .slice(0, 10);
  }
}
